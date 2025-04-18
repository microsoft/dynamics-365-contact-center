/// <reference path="typings/StandaloneSDK.d.ts" />

import Microsoft, { ISentimentObject } from "typings/StandaloneSDK.d.ts";

declare const window: any;
function sentimentChange() {
  // Remove the previous handler if it exists, this is to avoid duplicate handler registration if you use CCaaS SDK in form onload scripts
  if (window.top.sentimentHandlerId) {
    Microsoft.CCaaS.StandaloneSDK.utility.removeEventHandlerById(
      window.top.sentimentHandlerId
    );
  }

  // handlerId is a parameter returned by the onSentimentChange method to allow for handler removal
  const handlerId =
    Microsoft.CCaaS.StandaloneSDK.conversation.onCustomerSentimentChange((e: ISentimentObject) => 
      // Callback function
      console.log("CCaaSSdk Standalone: Sentiment", e)
    );
  // Store the handlerId in the global window object so that we can clean up the handler later
  window.top.sentimentHandlerId = handlerId;
}