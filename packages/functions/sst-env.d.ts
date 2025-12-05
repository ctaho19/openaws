/// <reference types="sst/node" />

import "sst/node/table";

declare module "sst/node/table" {
  export interface TableResources {
    UserProgress: {
      tableName: string;
    };
  }
}
