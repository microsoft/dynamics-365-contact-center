export interface ClickDialPayloadInfo {
	number: string;
}
declare class CTIDriverModule {
	private eventManager;
	private static instance;
	private constructor();

	/**
	 * @description
	 * Subscribes to the event that triggers when the visibility of the SoftPhone Panel in the CRM has to be changed.
	 * This event notifies whether the SoftPhone Panel has to be shown or hidden in the agent's CRM interface.
	 * @param callback - A function to be invoked when the visibility of the SoftPhone Panel has to be changed.
	 * The `callback` receives a boolean value, where `true` indicates that the panel should be made visible,
	 * and `false` indicates that it should be made hidden. Inside the callback, the CTI library method has to be invoked
	 * to show/hide the SoftPhone Panel in the CRM.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.ctiDriver.onSoftPhonePanelVisibilityChange((isVisible) => {
	 *   if (isVisible) {
	 *     console.log("SoftPhone Panel is now visible.");
	 *   } else {
	 *     console.log("SoftPhone Panel is now hidden.");
	 *   }
	 * });
	 */
	onSoftPhonePanelVisibilityChange(callback: (visible: boolean) => void): void;
	/**
	 * @description
	 * Subscribes to the event that triggers when the width of the SoftPhone Panel in the CRM has to be changed.
	 * This event notifies the agent's CRM interface about the new width of the SoftPhone Panel.
	 * @param callback - A function to be invoked when the width of the SoftPhone Panel has to be updated.
	 * The `callback` receives a numeric value representing the new width (in pixels) of the panel.
	 * Inside the callback, the CTI library method has to be invoked to update the SoftPhone Panel's width in the CRM.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.ctiDriver.onSoftPhonePanelWidthChange((newWidth) => {
	 *   console.log(`SoftPhone Panel width has been updated to: ${newWidth}px`);
	 * });
	 */
	onSoftPhonePanelWidthChange(callback: (width: number) => void): void;
	/**
	 * @description
	 * Subscribes to the event that triggers when the height of the SoftPhone Panel in the CRM has to be changed.
	 * This event notifies the agent's CRM interface about the new height of the SoftPhone Panel.
	 * @param callback - A function to be invoked when the height of the SoftPhone Panel has to be updated.
	 * The `callback` receives a numeric value representing the new height (in pixels) of the panel.
	 * Inside the callback, the CTI library method has to be invoked to update the SoftPhone Panel's height in the CRM.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.ctiDriver.onSoftPhonePanelHeightChange((newHeight) => {
	 * console.log(`SoftPhone Panel height has been updated to: ${newHeight}px`);
	 * });
	 */
	onSoftPhonePanelHeightChange(callback: (height: number) => void): void;
	/**
	 * @description
	 * Sends the data required for initiating an outbound call, such as the phone number, to the CCaaS UI.
	 * This method allows the number to be displayed in the dialer of the CCaaS UI, enabling the agent to make a call by clicking the call button.
	 * It is triggered by the CTI Driver when an outbound call needs to be initiated from a saved number in the CRM.
	 * @param dialPayload - An object of type `ClickDialPayloadInfo` containing details of the phone number.
	 * @example
	 * const dialPayload = {
	 *   number: "+1234567890"
	 * };
	 * window.Microsoft.CCaaS.EmbedSDK.ctiDriver.clickToDial(dialPayload);
	 */
	clickToDial(dialPayload: ClickDialPayloadInfo): void;
}
export type Entity = {
	[key: string]: string;
};
export interface ITemplateParameter {
	[key: string]: any;
}
export interface INotifyEventObject {
	templateName: string;
	templateParameters: ITemplateParameter;
	templateNameResolver?: string;
	customParams: object;
	messageNotificationType?: string;
	notificationAction?: string;
	cancellationToken?: string;
	eventType?: string;
	correlationId?: string;
}
export interface IConversationLoadedEventData {
	liveWorkItemId: string;
	conversationType: string;
	createdTimeStamp: string;
	liveWorkStreamId?: string;
	sessionId: string;
	customerName: string;
	customerPhoneNumber?: string;
}
declare enum SenderType {
	Agent = 1,
	Customer = 3
}
declare enum ContentType {
	"Text" = 0,
	"RichText" = 1
}
export interface MessageSender {
	id: string;
	displayName: string;
}
export interface MessageFileMetadata {
	id: string;
	name: string;
	type: string;
}
export interface IMessage {
	content: string;
	contentType: ContentType;
	id: string;
	timestamp: string;
	sender: MessageSender;
	fileMetadata?: MessageFileMetadata;
}
export interface IMessageEventData {
	liveWorkItemId: string;
	senderType: SenderType;
	message: IMessage;
}
export interface IParticipant {
	isPrimary: boolean;
	systemUserId: string;
}
export interface IConsultEventData {
	liveWorkItemId: string;
	activeParticipantList: IParticipant;
}
export interface IAttachmentInfo {
	annotationid: string;
	filename: string;
	contentType: string;
}
export interface ITranscriptMessage {
	id: string;
	content: string;
	mode: "external" | "internal";
	createdOn: string;
	sender: {
		user: {
			displayName: string;
			id: string;
		};
	};
	attachmentInfo: IAttachmentInfo[];
}
export interface IConversationEventBase {
	liveWorkItemId: string;
}
declare enum SentimentState {
	NA = 0,
	VeryNegative = 7,
	Negative = 8,
	SlightlyNegative = 9,
	Neutral = 10,
	SlightlyPositive = 11,
	Positive = 12,
	VeryPositive = 13
}
export interface ISentimentObject extends IConversationEventBase {
	sessionId: string;
	sentiment: SentimentState;
}
declare enum TransferDestination {
	agent = "Agent",
	queue = "Queue"
}
export interface IConversationTransferData {
	liveWorkItemId: string;
	sessionId: string;
	transferDestination: TransferDestination;
}
declare enum OCLiveWorkItemStatus {
	Active = 2,
	WrapUp = 5,
	Closed = 4
}
export interface IConversationStatusChangeData {
	liveWorkItemId: string;
	statusCode: OCLiveWorkItemStatus;
}
export interface INotesAddedEvent {
	text: string;
	entityId: string;
	entityName: string;
	liveWorkItemId: string;
}
export interface IConversationData {
	activityid: string;
	msdyn_activeagentassignedon: string;
	msdyn_channel: string;
	msdyn_closedon: string;
	msdyn_createdon: string;
	msdyn_customerlocale: string;
	msdyn_customersentimentlabel: number;
	msdyn_initiatedon: string;
	msdyn_isoutbound: boolean;
	msdyn_modifiedon: string;
	msdyn_ocliveworkitemid: string;
	msdyn_overflowtransfercount: number;
	msdyn_startedon: string;
	msdyn_statusupdatedon: string;
	msdyn_title: string;
	msdyn_transfercount: number;
	msdyn_urcustomersentimentkeywords: string | null;
	msdyn_urcustomersentimentlabel: string | null;
	msdyn_urcustomersentimentscore: number | null;
	msdyn_workstreamworkdistributionmode: number;
	msdyn_wrapupinitiatedon: string;
	statecode: number;
	statuscode: number;
	subject: string;
}
declare class ConversationModule {
	private eventManager;
	private conversations;
	private static instance;
	private constructor();

	/**
	 * @description Subscribes to the conversation loaded event.
	 * @param callback -  A function to be called when a conversation is loaded.
	 * The callback receives an `eventData` object of type `IConversationLoadedEventData` containing details about the loaded conversation.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.conversation.onConversationLoaded((eventData) => {
	 *   console.log(`Conversation loaded with ID: ${eventData.liveWorkItemId}`);
	 * });
	 */
	onConversationLoaded(callback: (eventData: IConversationLoadedEventData) => void): void;

	/**
	 * @description Subscribes to the conversation transfer event.
	 * @param callback -  A function to be called when a conversation transfer is initiated.
	 * The callback receives an `eventData` object of type `IConversationTransferData` containing details about the conversation that is getting transferred.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.conversation.onTransfer((eventData) => {
	 *   console.log(`Conversation transferred with ID: ${eventData.liveWorkItemId}`);
	 * });
	 */
	onTransfer(callback: (eventData: IConversationTransferData) => void): void;
	/**
	 * @description Subscribes to the conversation status change event.
	 * @param callback -  A function to be called when a conversation status is changed.
	 * The callback receives an `eventData` object of type `IConversationStatusChangeData` containing details about the conversation id and updated status.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.conversation.onStatusChange((eventData) => {
	 *   console.log(`Conversation status changed with ID: ${eventData.liveWorkItemId} and status: ${eventData.statusCode}`);
	 * });
	 */
	onStatusChange(callback: (eventData: IConversationStatusChangeData) => void): void;
	/**
	 * @description Subscribes to the new message event from agent/customer.
	 * @param callback -  A function to be called when a new message is sent/received.
	 * The callback receives an `eventData` object of type `IMessageEventData` containing details about message.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.conversation.onNewMessage((eventData) => {
	 *   console.log(`New message with the text: ${eventData.message}`);
	 * });
	 */
	onNewMessage(callback: (eventData: IMessageEventData) => void): void;
	/**
	 * @description Subscribes to the event triggered when an agent accepts a new conversation.
	 * @param callback -   A function to be called when a new conversation is accepted.
	 * The callback receives the `liveWorkItemId` of the accepted conversation as a parameter.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.conversation.onAccept((eventData) => {
	 *    console.log(`Conversation accepted with ID: ${eventData.liveWorkItemId}`);
	 * });
	 */
	onAccept(callback: (eventData: IConversationEventBase) => void): void;
	/**
	 * @description Subscribes to the event triggered when a consultation starts between agents.
	 * @param callback - A function to be called when a consultation starts.
	 * The callback receives an `eventData` object of type `IConsultEventData` containing details about the consultation.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.conversation.onConsultStart((eventData) => {
	 *    console.log("Consultaion started with these details", eventData);
	 * });
	 */
	onConsultStart(callback: (eventData: IConsultEventData) => void): void;
	/**
	 * @description Subscribes to the event triggered when either primary agent ends the consultation or secondary agent leaves the consultation
	 * @param callback - A function to be called when a consultation ends.
	 * The callback receives an `eventData` object of type `IConsultEventData` containing details about the consultation.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.conversation.onConsultEnd((eventData) => {
	 *    console.log("Consultaion ended with these details", eventData);
	 * });
	 */
	onConsultEnd(callback: (eventData: IConsultEventData) => void): void;
	/**
	 * @description Subscribes to the event triggered when an agent rejects a new conversation.
	 * @param callback -A function to be called when a new conversation is rejected.
	 * The callback receives the `liveWorkItemId` of the rejected conversation as a parameter.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.conversation.onReject((eventData) => {
	 *    console.log(`Conversation rejected with ID: ${eventData.liveWorkItemId}`);
	 * });
	 */
	onReject(callback: (eventData: IConversationEventBase) => void): void;
	/**
	 * @description Retrieves the transcript of messages for a specified live work item.
	 * @param liveWorkItemId - The conversationId for which the transcript is to be retrieved.
	 * @returns A promise that resolves to an array of `ITranscriptMessage` objects, each representing a message in the transcript.
	 * @example
	 * window.Microsoft.CCaaS.Embed.conversation.getTranscript("12345").then((transcript) => {
	 * console.log("transcript received", transcript);
	 * }).catch((error) => {
	 * console.error("Failed to retrieve transcript:", error);
	 * });
	 */
	getTranscript(liveWorkItemId: string): Promise<ITranscriptMessage[]>;
	/**
	 * @description Subscribes to the event triggered when a customer's sentiment changes.
	 * @param callback - A function to be called when the customer's sentiment changes.
	 * The callback receives a `sentimentData` object of type `ISentimentObject` containing details about the updated sentiment.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.conversation.onCustomerSentimentChange((sentimentData) => {
	 *   console.log(`Customer sentiment changed to: ${sentimentData.sentiment}`);
	 *   console.log(`Sentiment details:`, sentimentData);
	 * });
	 */
	onCustomerSentimentChange(callback: (sentimentData: ISentimentObject) => void): void;
	/**
	 * @description Retrieves conversation data for a specified conversation ID.
	 * @param liveWorkItemId - The liveWorkItemId of the conversation for which data is to be retrieved.
	 * @param columns - An array of column names specifying which data fields to retrieve. The column names can be taken from this URL:https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/supported-customizations#logical-column-names
	 * @returns A promise that resolves to a `Partial<IConversationData>` object containing the requested conversation data.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.conversation.getConversationData("12345", ["msdyn_ocliveworkitemid", "msdyn_channel", "statuscode", "msdyn_createdon"]).then((data) => {
	 *   console.log("Conversation data:", data);
	 * }).catch((error) => {
	 *   console.error("Failed to retrieve conversation data:", error);
	 * });
	 */
	getConversationData(liveWorkItemId: string, columns: string[]): Promise<Partial<IConversationData>>;
	/**
	 * @description Retrieves conversation data using a specified FetchXML query.
	 * This method allows for complex querying of conversation data using FetchXML, a proprietary query language for Dynamics 365.
	 * @deprecated This method is deprecated and will be removed in future versions.
	 * @param options - An object containing the name of the query and the FetchXML string.
	 * @param options.name - The name of the FetchXML query.
	 * @param options.fetchXml - The FetchXML query string used to retrieve the conversation data.
	 * @returns A promise that resolves to the result of the FetchXML query.
	 * @example
	 * const fetchXmlQuery = `
	 *   <fetch mapping="logical" distinct="true">
	 *     <entity name="msdyn_ocliveworkitem">
	 *       <attribute name="msdyn_isoutbound" />
	 *           <attribute name="msdyn_channel" />
	 *       <attribute name="subject" />
	 *       <filter type="and">
	 *         <condition attribute="activityid" operator="eq" uitype="msdyn_ocliveworkitem" value="${CONVERSATION_ID}"/>
	 *       </filter>
	 *       <link-entity name="contact" from="contactid" to="msdyn_customer" visible="false" link-type="outer">
	 *         <attribute name="fullname" alias="contactname" />
	 *         <attribute name="contactid" alias="contact_id" />
	 *       </link-entity>
	 *     *       <link-entity name="account" from="accountid" to="msdyn_customer" visible="false" link-type="outer">
	 *         <attribute name="name" alias="accountname" />
	 *         <attribute name="accountid" alias="account_id" />
	 *       </link-entity>
	 *     </entity>
	 *   </fetch>`;
	 * window.Microsoft.CCaaS.EmbedSDK.conversation.getConversationDataUsingFetchXML({ name: "msdyn_ocliveworkitems", fetchXml: fetchXmlQuery })
	 *   .then((data) => {
	 *     console.log("Fetched conversation data:", data);
	 *   })
	 *   .catch((error) => {
	 *     console.error("Failed to retrieve conversation data:", error);
	 *   });
	 */
	getConversationDataUsingFetchXML(options: { name: string; fetchXml: string }): Promise<Entity>;
	/**
	 * @description Subscribes to the event triggered when a new note is added.
	 * @param callback - A function to be called when a new note is added.
	 * The callback receives a `notesData` object of type `INotesAddedEvent` containing details about the added note.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.conversation.onNotesAdded((notesData) => {
	 *   console.log(`Note added with text: ${notesData.text}`);
	 *   console.log(`Entity ID: ${notesData.entityId}`);
	 *   console.log(`Entity Name: ${notesData.entityName}`);
	 *   console.log(`Live Work Item ID: ${notesData.liveWorkItemId}`);
	 * });
	 */
	onNotesAdded(callback: (notesData: INotesAddedEvent) => void): void;
	/**
	 * @description Retrieves the list of conversations assigned to the logged-in agent based on the specified status.
	 * @param status - The status of the live work items to filter the assigned conversations.
	 * The `status` parameter is of type `OCLiveWorkItemStatus`, representing the desired status (e.g., 2 - Active, 5 - Wrap-Up).
	 * @returns A promise that resolves to an `IAssignedConversationList` object,
	 * containing details of the conversations assigned to the logged-in agent.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.conversation.getAssignedConversationsList(OCLiveWorkItemStatus.Active).then((conversationList) => {
	 *   console.log("Assigned Conversations:", conversationList);
	 * }).catch((error) => {
	 *   console.error("Failed to retrieve assigned conversations:", error);
	 * });
	 */
	getAssignedConversationsList(status: OCLiveWorkItemStatus): Promise<IAssignedConversationList>;
	/**
	 * @description Retrieves the ID of the conversation currently focused in the UI.
	 * @returns A promise that resolves to a string representing the `conversationId`
	 * of the conversation currently in focus.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.conversation.getFocusedConversationId().then((conversationId) => {
	 *   console.log("Focused Conversation ID:", conversationId);
	 * }).catch((error) => {
	 *   console.error("Failed to retrieve focused conversation ID:", error);
	 * });
	 */
	getFocusedConversationId(): Promise<string>;
}

declare enum BasePresenceStatus {
	AVAILABLE = "AVAILABLE",
	AWAY = "AWAY",
	BUSY = "BUSY",
	BUSY_DO_NOT_DISTURB = "BUSY_DO_NOT_DISTURB",
	OFFLINE = "OFFLINE"
}
export interface IPresence{
	presenceId: string;
	presenceName: string;
	presenceText: string;
	basePresenceStatus: BasePresenceStatus;
	presenceColor: string | undefined;
	canUserSet: boolean;
}
declare class PresenceModule {
	private eventManager;
	private static instance;
	private constructor();

	/**
	 * @description Retrieves the current presence status of the logged-in agent.
	 * This method returns information about the agent's presence, such as their availability or activity status.
	 * @returns A promise that resolves to a `IPresence` object,
	 * containing details about the agent's current presence status, including fields like `presenceId`,
	 * `presenceName`, `presenceText`, and other relevant information.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.presence.getPresence().then((presenceInfo) => {
	 *   console.log("Agent's Current Presence:", presenceInfo);
	 *   if (presenceInfo.presenceName === "available") {
	 *     console.log("The agent is available for new tasks.");
	 *   } else {
	 *     console.log(`The agent is currently ${presenceInfo.presenceText}.`);
	 *   }
	 * }).catch((error) => {
	 *   console.error("Failed to retrieve agent's presence status:", error);
	 * });
	 */
	getPresence(): Promise<IPresence>;
	/**
	 * @description Sets the presence status of the logged-in agent based on the specified presence ID.
	 * This method updates the agent's presence to reflect their current availability or activity status.
	 * @param presenceId - The ID of the desired presence status to set. This id can be retrieved from getPresenceOptions API
	 * @returns A promise that resolves when the presence status is successfully updated.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.presence.setPresence("f523f628-c07a-e811-8162-000d3aa11f50").then(() => {
	 *   console.log("Agent's presence status has been updated to 'Available'.");
	 * }).catch((error) => {
	 *   console.error("Failed to update agent's presence status:", error);
	 * });
	 */
	setPresence(presenceId: string): Promise<void>;
	/**
	 * @description Subscribes to the presence change event for the logged-in agent.
	 * This event is triggered whenever the agent's presence status is updated,
	 * reflecting a change in their availability or activity state.
	 * @param callback - A function to be invoked when the presence change occurs.
	 * The `callback` receives a `presenceChangeData` object of type `IPresence`,
	 * containing details about the updated presence, such as its ID, name, and other relevant information.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.presence.onPresenceChange((presenceChangeData) => {
	 *   console.log("Agent's presence has changed:", presenceChangeData);
	 *   console.log(`New Presence: ${presenceChangeData.presenceName}`);
	 * });
	 */
	onPresenceChange(callback: (presenceChangeData: IPresence) => void): void;
	/**
	 * @description Retrieves all the available presence options for the logged-in agent.
	 * These options represent the different presence states (e.g., "Available", "Busy", "Do Not Disturb")
	 * that the agent can choose from.
	 * @returns A promise that resolves to an array of `IPresence` items.
	 * Each object contains details about a specific presence option, including its ID, name, description,
	 * and other relevant information.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.presence.getPresenceOptions().then((presenceOptions) => {
	 *   console.log("Available Presence Options:", presenceOptions);
	 *   presenceOptions.forEach((option) => {
	 *     console.log(`ID: ${option.presenceId}, Name: ${option.presenceName}`);
	 *   });
	 * }).catch((error) => {
	 *   console.error("Failed to retrieve presence options:", error);
	 * });
	 */
	getPresenceOptions(): Promise<IPresence[]>;
}
declare enum NotificationLevels {
	Success = 1,
	Error = 2,
	Warning = 3,
	Information = 4
}
export interface INotificationOptions {
	level: NotificationLevels;
	message: string;
}
export interface INotification {
	notificationId: string;
	notificationOptions: INotificationOptions;
}
export interface INewConversationEventData {
	liveworkItemId: string;
	title: string;
	msdyn_WorkstreamId: string;
	queueId: string;
	createdOn: string;
	customerName: string;
	visitorLanguage: string;
	visitorDevice: string;
	msdyn_CustomerType?: "contact" | null;
	msdyn_CustomerId?: string | null;
	msdyn_CustomerName?: string | null;
	msdyn_CustomerPhone?: string | null;
}
declare class NotificationModule {
	private eventManager;
	private static instance;
	private constructor();

	/**
	 * @description Subscribes to notifications for new conversations.
	 * This event is triggered when a new conversation is assigned to the agent.
	 *
	 * @param callback - A function invoked when a new conversation notification is received.
	 * The `callback` receives an `eventData` object of type `INewConversationEventData`,
	 * containing details about the new conversation, such as conversation ID(liveWorkItemId) and other metadata.
	 *
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.notification.onNewConversationNotification((eventData) => {
	 *   console.log("New Conversation Notification Received:", eventData);
	 * });
	 */
	onNewConversationNotification(callback: (eventData: INewConversationEventData) => void): void;
	/**
	 * @description Adds a new notification to the CCaaS UI.
	 * This method allows developers to programmatically display notifications in the agent's interface,
	 * such as alerts, reminders, or updates about ongoing tasks or system events.
	 *
	 * @param newNotificationData - An object of type `INotificationOptions` containing details of the notification,
	 * such as its level (info, warning, error), message.
	 *
	 * @returns A promise that resolves to a `string`, representing the `notificationId` of the newly added notification.
	 * This ID can be used for future actions, such as updating or removing the notification.
	 *
	 * @example
	 * const notificationOptions = {
	 *   level: NotificationLevels.Information,
	 *   message: "New conversation assigned to you!",
	 * };
	 *
	 * window.Microsoft.CCaaS.EmbedSDK.notifications.addNewNotification(notificationOptions)
	 *   .then((notificationId) => {
	 *     console.log("Notification added with ID:", notificationId);
	 *   })
	 *   .catch((error) => {
	 *     console.error("Failed to add notification:", error);
	 *   });
	 */
	addNewNotification(newNotificationData: INotificationOptions): Promise<string>;

	/**
	 * @description Subscribes to notifications for new alerts.
	 * This event is triggered when a new notification is displayed in the CCaaS UI.
	 *
	 * @param callback - A function invoked when a new notification is received.
	 * The `callback` receives an `eventData` object of type `INotification`,
	 * containing details about the notification, such as notification ID and options.
	 *
	 * @example
	 * window.Microsoft.CCaaS.ExternalSDK.notification.onNewNotification((eventData) => {
	 *   console.log("New Notification Received:", eventData);
	 * });
	 */
	onNewNotification(callback: (eventData: INotification) => void): void;
}
export interface IAssignedConversationList {
	liveWorkItemId: string;
}

export interface IHoldChangeEventData {
	liveWorkItemId: string;
	isAgentOnHold: boolean;
}
export interface IMuteChangeEventData {
	isAgentMuted: boolean;
	liveWorkItemId: string;
}
declare class VoiceOrVideoCallingModule {
	private eventManager;
	private static instance;
	private constructor();

	/**
	 * @description Subscribes to the hold state change event for a voice call for an agent.
	 * This event is triggered whenever the agent changes the hold state of a call.
	 * @param callback - A function to be invoked when the hold state changes.
	 * The `callback` receives a `holdChangeData` object of type `IHoldChangeEventData`,
	 * containing details about the hold state change, such as whether the call is on hold or resumed.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.voiceOrVideoCalling.onHoldChange((holdChangeData) => {
	 *   console.log("Hold state changed for the call:", holdChangeData);
	 *   if (holdChangeData.isAgentOnHold) {
	 *     console.log("Agent has put the call on hold.");
	 *   } else {
	 *     console.log("Agent has resumed the call.");
	 *   }
	 * });
	 */
	onHoldChange(callback: (holdChangeData: IHoldChangeEventData) => void): void;
	/**
	 * @description Subscribes to the mute state change event for a voice call.
	 * This event is triggered whenever the agent mutes or unmutes the call.
	 * @param callback - A function to be invoked when the mute state changes.
	 * The `callback` receives a `muteChangeData` object of type `IMuteChangeEventData`,
	 * containing details about the mute state change, such as whether the call is muted or unmuted.
	 * @example
	 * window.Microsoft.CCaaS.EmbedSDK.voiceOrVideoCalling.onMuteChange((muteChangeData) => {
	 *   console.log("Mute state changed for the call:", muteChangeData);
	 *   if (muteChangeData.isAgentMuted) {
	 *     console.log("The agent has muted the call.");
	 *   } else {
	 *     console.log("The agent has unmuted the call.");
	 *   }
	 * });
	 */
	onMuteChange(callback: (muteChangeData: IMuteChangeEventData) => void): void;
}
declare class DataverseModule {
	private static instance;
	private constructor();

	/**
	 * @description Retrieves multiple records from a Dataverse entity.
	 * This API fetches records based on the provided entity set logical Name and options.
	 *
	 * @param {string} entityLogicalName - The table logical name of the records you want to retrieve.
	 * For example: account
	 *
	 * @param {string} options - The query options used to filter, sort, or manipulate the data retrieval.
	 * This may include OData query parameters such as `$filter`, `$select`, `$orderby`, or a `fetchXml` string.
	 *
	 * @returns {Promise<T>} A promise that resolves with the list of records fetched from the Dataverse.
	 * The records are returned as an array of objects of type `T`, where `T` is a generic type representing the structure of the records.
	 *
	 * @example
	 * // Example using OData query options
	 * window.Microsoft.CCaaS.EmbedSDK.dataverse.retrieveMultipleRecords("accounts", "?$select=name&$top=3").then(
	 *     function success(result) {
	 *         for (var i = 0; i < result.entities.length; i++) {
	 *             console.log(result.entities[i]);
	 *         }
	 *         // perform additional operations on retrieved records
	 *     },
	 *     function (error) {
	 *         console.log(error.message);
	 *         // handle error conditions
	 *     }
	 * );
	 *
	 * // Example using FetchXml
	 * const fetchXml = "?fetchXml=<fetch mapping='logical'><entity name='account'><attribute name='accountid'/><attribute name='name'/></entity></fetch>";
	 * window.Microsoft.CCaaS.EmbedSDK.dataverse.retrieveMultipleRecords("accounts", fetchXml).then(
	 *     function success(result) {
	 *         for (var i = 0; i < result.entities.length; i++) {
	 *             console.log(result.entities[i]);
	 *         }
	 *         // perform additional operations on retrieved records
	 *     },
	 *     function (error) {
	 *         console.log(error.message);
	 *         // handle error conditions
	 *     }
	 * );
	 */
	retrieveMultipleRecords<T>(entityLogicalName: string, options: string): Promise<T>;
	/**
	 * @description Retrieves a single record from a Dataverse entity by its unique identifier.
	 * This API fetches a specific record based on the provided entity logical name, record ID, and options.
	 *
	 * @param {string} entityLogicalName - The table logical name of the records you want to retrieve.
	 * For example: account
	 * This path represents the specific collection of data you want to query.
	 *
	 * @param {string} id - The unique identifier of the record to retrieve.
	 * This ID is used to locate the specific record within the entity set.
	 *
	 * @param {string} options - The query options used to filter, select, or manipulate the data retrieval.
	 * This may include OData query parameters such as `$select` or `$expand`.
	 *
	 * @returns {Promise<Entity>} A promise that resolves with the record fetched from the Dataverse.
	 * The record is returned as an object of type `Entity`, representing the structure of the record.
	 *
	 * @example
	 * // Example using OData query options
	 * window.Microsoft.CCaaS.EmbedSDK.dataverse.retrieveRecord("accounts", "00000000-0000-0000-0000-000000000000", "?$select=name").then(
	 *     function success(result) {
	 *         console.log(result);
	 *         // perform additional operations on the retrieved record
	 *     },
	 *     function (error) {
	 *         console.log(error.message);
	 *         // handle error conditions
	 *     }
	 * );
	 */
	retrieveRecord(entityLogicalName: string, id: string, options: string): Promise<Entity>;
}
export declare class EmbedSDK {
	private ctiDriverModule;
	private conversationModule;
	private notificationModule;
	private presenceModule;
	private voiceOrVideoCallingModule;
	private dataverseModule;
	get ctiDriver(): CTIDriverModule;
	get conversation(): ConversationModule;
	get notification(): NotificationModule;
	get presence(): PresenceModule;
	get voiceOrVideoCalling(): VoiceOrVideoCallingModule;
	get dataverse(): DataverseModule;
}

declare const Microsoft: {
	CCaaS: {
		EmbedSDK: EmbedSDK;
	};
};

export {
	Microsoft as default,
};

export {};
