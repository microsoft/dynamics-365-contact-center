// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
export interface ICTIInterface {
  /**
   * @description Initialize the scripts and do the operations once it is loaded
   * @returns Promise void
   */
  initialize(): Promise<boolean>;

  /**
   * @description bind all the events of embed SDK API, it gets called by CCaaS UI
   * @returns Promise void
   */
  bindEvents(): void;
}