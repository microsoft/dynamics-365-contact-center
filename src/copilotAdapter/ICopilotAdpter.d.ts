// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export enum ObjectType {
	Case,
	Email,
	Chat,
	PhoneCall
}
export enum Priority {
	High = 1,
	Meduim = 2,
	Low = 3
}
export enum CaseType {
	Question = 1,
	Problem = 2,
	Request = 3
}
interface ThirdPartyObject {
	objectType: ObjectType;
	objectId: string; // Record is in Dynamics. Unique identifier not PII or EUII
}

export interface GetDataRequest extends ThirdPartyObject {}
interface EmailData {
	to: string;
	from: string;
	subject: string;
	description: string;
}
interface CaseData {
	title: string;
	description: string;
	product_name?: string;
	priority: Priority;
	subject?: string;
	customerName: string;
	caseType: CaseType;
}
export interface GetDataResponse extends ThirdPartyObject {
	data: EmailData | CaseData | any;
}
export interface ProcessDataRequest extends ThirdPartyObject {
	data: string; //Eg: Draft gerenated by Copilot
}
export interface ProcessDataResponse extends ThirdPartyObject {
	success: boolean;
	message?: string;
}
type OnPageNavigationCallbackFunction = (payload: ThirdPartyObject) => void;
type newEventCallbackFunction = (payload: any) => void;

export interface ICopilotAdapter {
	initialize(): Promise<boolean>;
	onPageNavigation(callback: OnPageNavigationCallbackFunction): void;
	getData(request: GetDataRequest): Promise<GetDataResponse>;
	processData(request: ProcessDataRequest): Promise<ProcessDataResponse>;
	onNewEvent(callback: newEventCallbackFunction): void;
}
