
type Entity = {
	[key: string]: string;
};

interface IConversation {
	/**
	 * @description Get conversation data
	 * @param id
	 * @param columns
	 * @returns Promise<Entity>
	 * @memberof IConversation
	 * @example
     * ccaaSDKInstance.conversation.getData('123', ['id', 'sender', 'timestamp', 'content']);
	 */
	getConversationData(id: string, columns: string[]): Promise<Entity>;

    /**
	 * @description method to get conversation data using fecthxml options
	 * @param options
	 * @memberof IConversation
	 * @example
	 * ccaaSDKInstance.conversation.getConversationDataUsingFetchXML(options);
	 */
	getConversationDataUsingFetchXML(options: {
		name: string;
		fetchXml: string;
	}): Promise<Entity>;
	
}

export declare class CCaaSSdk {
	get conversation(): IConversation;
	static getInstance(): CCaaSSdk;
}