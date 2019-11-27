export interface Installation {
  organization: string;
  appInstallation: string;
  makeflowBaseURL: string;
  active?: boolean;
  accessToken?: string;
}

export interface InstallationIdentity {
  organization: string;
  appInstallation: string;
}
