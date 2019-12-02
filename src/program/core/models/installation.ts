import {ObjectId} from 'mongodb';

import {Installation} from '../../types';

export interface InstallationDocument extends Installation {
  _id: ObjectId;
}
