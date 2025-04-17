import Microsoft, {
    IAssignedConversationList,
    IConsultEventData,
    IConversationData,
    IConversationEventBase,
    IConversationLoadedEventData,
    IConversationStatusChangeData,
    IConversationTransferData,
    IHoldChangeEventData,
    IMessageEventData,
    IMuteChangeEventData,
    INewConversationEventData,
    INotesAddedEvent,
    INotification,
    INotificationOptions,
    IPresence,
    ISentimentObject,
    ITranscriptMessage
} from "@ccaas/CCaaSEmbedSDK";

enum BasePresenceStatus {
	AVAILABLE = "AVAILABLE",
	AWAY = "AWAY",
	BUSY = "BUSY",
	BUSY_DO_NOT_DISTURB = "BUSY_DO_NOT_DISTURB",
	OFFLINE = "OFFLINE"
}

enum NotificationLevels {
	Success = 1,
	Error = 2,
	Warning = 3,
	Information = 4
}

enum OCLiveWorkItemStatus {
	Active = 2,
	WrapUp = 5,
	Closed = 4
}

type EmbedSDK = typeof Microsoft.CCaaS.EmbedSDK;

export function embedSDKSampleUsage(): void {
    const embedSDK: EmbedSDK = (window as any).Microsoft.CCaaS.EmbedSDK;

    if (embedSDK) {

        embedSDK.conversation.onNotesAdded((noteText: INotesAddedEvent) => {
            console.log("Embed SDK New Note Created", noteText);
        });

        embedSDK.conversation.onConversationLoaded(async (conversationData: IConversationLoadedEventData) => {
            console.log("Embed SDK Conversation Loaded", conversationData);
            presenceAPIs(embedSDK);
            getFocusedConversationId(embedSDK);

            //fetches conversation data, if an account/contact is found then it shows screen pop with customer information
            const conversationDetails = await getConversationDataUsingFetchXML(embedSDK, conversationData.liveWorkItemId);

            try {
                if (conversationDetails) {
                    if (Object.prototype.hasOwnProperty.call(conversationDetails, "contact_id")) {
                        handleContact(conversationDetails);
                    }
                    else if (Object.prototype.hasOwnProperty.call(conversationDetails, "account_id")) {
                        handleAccount(conversationDetails);
                    }
                }
            } catch (error) {
                console.error(error);
            }

            function handleContact(conversationDetails: any) {
                embedSDK.dataverse
                    .retrieveRecord(
                        "contacts",
                        conversationDetails.contact_id,
                        "?$select=msdyn_source_crm_id,msdyn_source_crm_url"
                    )
                    .then((contactDetails: any) => {
                        if (
                            contactDetails.msdyn_source_crm_id &&
                            contactDetails.msdyn_source_crm_url &&
                            contactDetails.msdyn_source_crm_url.includes("service-now.com")
                        ) {
                            (window as any).openFrameAPI.openServiceNowForm({
                                entity: "customer_contact",
                                query: `sys_id=${contactDetails.msdyn_source_crm_id}`
                            });
                        }
                    })
                    .catch((error: any) => {
                        console.error("Error fetching contacts data:", error);
                    });
            }

            function handleAccount(conversationDetails: any) {
                embedSDK.dataverse
                    .retrieveRecord(
                        "accounts",
                        conversationDetails.account_id,
                        "?$select=msdyn_source_crm_id,msdyn_source_crm_url"
                    )
                    .then((accountDetails: any) => {
                        if (
                            accountDetails.msdyn_source_crm_id &&
                            accountDetails.msdyn_source_crm_url &&
                            accountDetails.msdyn_source_crm_url.includes("service-now.com")
                        ) {
                            (window as any).openFrameAPI.openServiceNowForm({
                                entity: "customer_contact",
                                query: `sys_id=${accountDetails.msdyn_source_crm_id}`
                            });
                        }
                    })
                    .catch((error: any) => {
                        console.error("Error fetching accounts data:", error);
                    });
            }
        });

        embedSDK.conversation.onTransfer((conversationTransferData: IConversationTransferData) => {
            console.log("Embed SDK Conversation Transferred", conversationTransferData);
        });

        embedSDK.conversation.onStatusChange((conversationData: IConversationStatusChangeData) => {
            console.log("Embed SDK Conversation State Changed", conversationData);

            if (conversationData.statusCode === OCLiveWorkItemStatus.Closed) {
                getTranscript(embedSDK, conversationData.liveWorkItemId);
            }
        });

        embedSDK.conversation.onNewMessage((messageData: IMessageEventData) => {
            console.log("Embed SDK New Message", messageData);
        });

        embedSDK.conversation.onAccept((eventData: IConversationEventBase) => {
            console.log("Embed SDK Conversation Accepted", eventData);
            addNewNotification(embedSDK);
            getAssignedConversationsList(embedSDK);
            getConversationData(embedSDK, eventData.liveWorkItemId);
            retrieveRecord(embedSDK, eventData.liveWorkItemId);
            retrieveMultipleRecords(embedSDK, eventData.liveWorkItemId);
        });

        embedSDK.conversation.onReject((eventData: IConversationEventBase) => {
            console.log("Embed SDK Conversation Rejected", eventData);
        });

        embedSDK.conversation.onConsultStart((consultData: IConsultEventData) => {
            console.log("Embed SDK Consult Started", consultData);
        });

        embedSDK.conversation.onConsultEnd((consultData: IConsultEventData) => {
            console.log("Embed SDK Consult Ended", consultData);
        });

        embedSDK.conversation.onCustomerSentimentChange((sentimentData: ISentimentObject) => {
            console.log("Embed SDK Customer Sentiment Changed", sentimentData);
        });

        embedSDK.notification.onNewConversationNotification((conversationData: INewConversationEventData) => {
            console.log("Embed SDK New Conversation Notification", conversationData);
        });

        embedSDK.notification.onNewNotification((notificationData: INotification) => {
            console.log("Embed SDK New Notification", notificationData);
        });

        embedSDK.presence.onPresenceChange((presenceData: IPresence) => {
            console.log("Embed SDK Agent Presence Changed", presenceData);
        });

        embedSDK.voiceOrVideoCalling.onHoldChange((holdChangeData: IHoldChangeEventData) => {
            console.log("Embed SDK Call hold changed", holdChangeData);
        });

        embedSDK.voiceOrVideoCalling.onMuteChange((muteChangeData: IMuteChangeEventData) => {
            console.log("Embed SDK Call mute changed", muteChangeData);
        });

        embedSDK.ctiDriver.onSoftPhonePanelHeightChange((height: number) => {
            setSoftPhonePanelHeight(height);
        });

        embedSDK.ctiDriver.onSoftPhonePanelWidthChange((width: number) => {
            setSoftPhonePanelWidth(width);
        });

        embedSDK.ctiDriver.onSoftPhonePanelVisibilityChange((visibility: boolean) => {
            setSoftPhonePanelVisibility(visibility);
        });
    }
}


const presenceAPIs = (embedSDK: EmbedSDK) => {
    embedSDK.presence.getPresence().then((presenceInfo: IPresence) => {
        console.log("Embed SDK Agent's Current Presence:", presenceInfo);
    }).catch((error) => {
        console.error("Embed SDK Failed to retrieve agent's presence status:", error);
    });

    embedSDK.presence.getPresenceOptions().then((presenceOptions: IPresence[]) => {
        console.log("Embed SDK Available Presence Options:", presenceOptions);

        const busyDNDOption = presenceOptions.find((option) => option.basePresenceStatus === BasePresenceStatus.BUSY_DO_NOT_DISTURB);
        if (busyDNDOption) {
            embedSDK.presence.setPresence(busyDNDOption.presenceId).then(() => {
                console.log("Embed SDK Agent's presence status has been updated to 'busyDND'.");
            }).catch((error) => {
                console.error("Embed SDK Failed to update agent's presence status:", error);
            });
        } else {
            console.warn("Embed SDK 'busyDND' presence option not found.");
        }
    }).catch((error) => {
        console.error("Embed SDK Failed to retrieve presence options:", error);
    });
}

const getTranscript = (embedSDK: EmbedSDK, liveWorkItemId: string) => {
    embedSDK.conversation.getTranscript(liveWorkItemId)
        .then((transcript: ITranscriptMessage[]) => {
            console.log("Embed SDK Transcript", transcript);
        }).catch((error) => {
            console.error("Embed SDK Failed to retrieve transcript:", error);
        });
}

const addNewNotification = (embedSDK: EmbedSDK) => {
    const notificationOptions: INotificationOptions = {
        level: NotificationLevels.Information,
        message: "New conversation assigned to you!",
    };

    embedSDK.notification.addNewNotification(notificationOptions)
        .then((notificationId: string) => {
            console.log("Embed SDK Notification added with ID:", notificationId);
        })
        .catch((error) => {
            console.error("Embed SDK Failed to add notification:", error);
        });
}

const getAssignedConversationsList = (embedSDK: EmbedSDK) => {
    embedSDK.conversation.getAssignedConversationsList(OCLiveWorkItemStatus.Active).then((conversationList: IAssignedConversationList) => {
        console.log("Embed SDK getAssignedConversationsList: Assigned Conversations:", conversationList);
    }).catch((error) => {
        console.error("Embed SDK getAssignedConversationsList: Failed to retrieve assigned conversations:", error);
    });
}

const getFocusedConversationId = (embedSDK: EmbedSDK) => {
    embedSDK.conversation.getFocusedConversationId().then((conversationId: string) => {
        console.log("Embed SDK getFocusedConversationId:  Focused Conversation ID:", conversationId);
    }).catch((error) => {
        console.error("Embed SDK getFocusedConversationId:  Failed to retrieve focused conversation ID:", error);
    });
}

const getConversationData = (embedSDK: EmbedSDK, liveWorkItemId: string) => {
    const columns = ["msdyn_ocliveworkitemid", "msdyn_channel", "statuscode", "msdyn_createdon"];
    embedSDK.conversation.getConversationData(liveWorkItemId, columns)
        .then((data: Partial < IConversationData > ) => {
            console.log("Embed SDK Conversation data:", data);
        }).catch((error) => {
            console.error("Embed SDK Failed to retrieve conversation data:", error);
        });
}

const retrieveRecord = (embedSDK: EmbedSDK, liveWorkItemId: string) => {
    embedSDK.dataverse.retrieveRecord("msdyn_ocliveworkitems", liveWorkItemId, "?$select=msdyn_createdon")
        .then((data) => console.log("Embed SDK  Retrieve record Response:", data))
        .catch((error) => console.error("Embed SDK Failed to retrieve record:", error));
}

const retrieveMultipleRecords = (embedSDK: EmbedSDK, liveWorkItemId: string) => {
    const fetchXml = `<fetch top="50"><entity name="msdyn_ocliveworkitem"><attribute name="msdyn_ocliveworkitemid"/><attribute name="msdyn_channel"/><attribute name="statuscode"/><attribute name="msdyn_createdon"/><filter><condition attribute="msdyn_ocliveworkitemid" operator="eq" value="${liveWorkItemId}"/></filter></entity></fetch>`;

    embedSDK.dataverse.retrieveMultipleRecords("msdyn_ocliveworkitems", `?fetchXml=${fetchXml}`)
        .then((data) => console.log("Embed SDK  Retrieve multiple records Response:", data))
        .catch((error) => console.error("Embed SDK Failed to retrieve multiple records:", error));
}

 const setSoftPhonePanelWidth = (width: number) => {
    (window as any).openFrameAPI.setWidth(width);
}

 const setSoftPhonePanelHeight = (height: number) => {
    (window as any).openFrameAPI.setHeight(height);
}

const setSoftPhonePanelVisibility = (visible: boolean) => {
    if (visible) {
        (window as any).openFrameAPI.show();
      } else {
        (window as any).openFrameAPI.hide();
      }
}

const getConversationDataUsingFetchXML = (embedSDK: EmbedSDK, liveWorkItemId: string) => {
    const fetchXmlQuery = `
    <fetch mapping="logical" distinct="true">
        <entity name="msdyn_ocliveworkitem">
            <attribute name="msdyn_isoutbound" />
 	        <attribute name="msdyn_channel" />
            <attribute name="subject" />
        <filter type="and">
            <condition attribute="activityid" operator="eq" uitype="msdyn_ocliveworkitem" value="${liveWorkItemId}"/>
        </filter>
        <link-entity name="contact" from="contactid" to="msdyn_customer" visible="false" link-type="outer">
            <attribute name="fullname" alias="contactname" />
            <attribute name="contactid" alias="contact_id" />
        </link-entity>
        <link-entity name="account" from="accountid" to="msdyn_customer" visible="false" link-type="outer">
                <attribute name="name" alias="accountname" />
                <attribute name="accountid" alias="account_id" />
        </link-entity>
        </entity>
     </fetch>`;
    return embedSDK.conversation.getConversationDataUsingFetchXML({ name: "msdyn_ocliveworkitems", fetchXml: fetchXmlQuery });
}