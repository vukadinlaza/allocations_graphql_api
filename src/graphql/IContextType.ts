import { Db } from "mongodb";
export interface IContextType {
  db: Db;
  token: string;
  user: any;
}
