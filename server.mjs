//  This is a prototype server which is fully extensible. We'll utilize this in our future Alexa codes


// We import all packages like we did in our old servers: 
import express from "express";
import axios from "axios";
import morgan from "morgan";

// We import Alexa from ask-sdk-core & ExpressAdapter from ask-sdk-express-adapter as the basic required packages
import Alexa, { SkillBuilders } from 'ask-sdk-core';
import { ExpressAdapter } from 'ask-sdk-express-adapter';

// Next, We integrate the database
import mongoose from 'mongoose';
// pasting the cluster's connection string/ URI and connecting to DB:
mongoose.connect('mongodb+srv://dbUser:<password>@cluster0.7bnpj.mongodb.net/<DatabaseName>?retryWrites=true&w=majority');

// Creating a prototype object which will be passed on to DB on each session created. Here the parameters are skill name, user name & session time
const Usage = mongoose.model('Usage', {
  skillName: String,
  userName: String,
  createdOn: { type: Date, default: Date.now },
});

// we start our express app and different objects such as skillBuilder, skill & adapter as the basics
const app = express();
app.use(morgan("dev"))
const PORT = process.env.PORT || 3000;
const skillBuilder = Alexa.SkillBuilders.custom();
const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, true, true);


// Code imported from Alexa skill:

// We'll now work solely on handlers and developing them for custom functionality or features:

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const speakOutput = 'Fallback intent: Sorry, I had trouble doing what you asked. Please try again.';
    console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'You will now talk to Kashif';
    const reprompt = 'I am your virtual assistant. you can ask for the menu';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(reprompt)
      .withSimpleCard("Kababjees", speakOutput)
      .getResponse();
  }
};

  const introHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'intro';
    },
    handle(handlerInput) {
      const speakOutput = 'Your Name is Kashif!';
      const reprompt = 'I am your virtual assistant. you can ask for the menu';
  
      return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(reprompt)
        .getResponse();
    }
  }

  // Here we develop a tracking handler that outputs the Device & User ID. This functionality is usable in case a user is placing order, purchasing an e-service or a subscription
  const deviceIdHandler = {
    canHandle(handlerInput) {
      return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'deviceId';
    },
    handle(handlerInput) {
  
      let deviceId = Alexa.getDeviceId(handlerInput.requestEnvelope)
      let userId = Alexa.getUserId(handlerInput.requestEnvelope)
  
      console.log("deviceId: ", deviceId); 
      const speakOutput = `your device id is: ${deviceId} \n\n\nand your user id is: ${userId}`
  
      return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(speakOutput)
        .getResponse();
    }
  };
  

  // After that, in the food ordering app scenario a crucial requirement is the user email. In order to fetch that, we create another handler:
  
  const EmailIntentHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'EmailIntent';
    },
    async handle(handlerInput) {
      const { serviceClientFactory, responseBuilder } = handlerInput;
  
      const apiAccessToken = Alexa.getApiAccessToken(handlerInput.requestEnvelope)
      console.log("apiAccessToken: ", apiAccessToken);
  
      try {
        // https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-customer-contact-information-for-use-in-your-skill.html#get-customer-contact-information
  
        const responseArray = await Promise.all([
          axios.get("https://api.amazonalexa.com/v2/accounts/~current/settings/Profile.email",
            { headers: { Authorization: `Bearer ${apiAccessToken}` } },
          ),
          axios.get("https://api.amazonalexa.com/v2/accounts/~current/settings/Profile.name",
            { headers: { Authorization: `Bearer ${apiAccessToken}` } },
          ),
        ])
  
        const email = responseArray[0].data;
        const name = responseArray[1].data;
        console.log("email: ", email);
  
        if (!email) {
          return handlerInput.responseBuilder
            .speak(`looks like you dont have an email associated with this device, please set your email in Alexa App Settings`)
            .getResponse();
        }
        return handlerInput.responseBuilder
          .speak(`Dear ${name}, your email is: ${email}`)
          .getResponse();
  
      } catch (error) {
        console.log("error code: ", error.response.status);
  
        if (error.response.status === 403) {
          return responseBuilder
            .speak('I\'m unable to get your email. Kindly look into this skill in your Alexa app and grant profile permissions to this skill')
            .withAskForPermissionsConsentCard(["alexa::profile:email:read"]) // https://developer.amazon.com/en-US/docs/alexa/custom-skills/request-customer-contact-information-for-use-in-your-skill.html#sample-response-with-permissions-card
            .getResponse();
        }
        return responseBuilder
          .speak('Uh Oh. Looks like something went wrong.')
          .getResponse();
      }
    }
  }
  
  // Next, we can develop another type of handlers like placeOrder, askMyOrder, askOrderStatus for a sample food ordering app respectively. We can develop handlers for any kind of functionality
  // Handlers:...



const skillBuilder = SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    introHandler,
    deviceIdHandler,
    EmailIntentHandler
  )
  .addErrorHandlers(
    ErrorHandler
  )


app.post('/api/v1/webhook-alexa', adapter.getRequestHandlers());

app.use(express.json())
// app.get('/profile', (req, res, next) => {
//   res.send("this is a profile");
// });

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});

// Moving to the deployment, we use Ngrok for temporary purposes and faster testing. 
// Ngrok is a cross-platform application that exposes local server ports to the Internet.
// When building an Alexa skill, the core logic of your code is exposed as a Rest API running on your local computer, and you can expose it to Alexa system via ngrok. Alexa requires https URL endpoint with a proper SSL certificate, and ngrok offers that.
// https://medium.com/@danielconde9/alexa-go-local-a3311ffe634d
// ngrok http 5000