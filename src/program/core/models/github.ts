import {ObjectId} from 'mongodb';

import {GithubInputs} from '../../services';

export interface GithubInputsDocument extends GithubInputs {
  _id: ObjectId;
  issueNumber: number;
}
