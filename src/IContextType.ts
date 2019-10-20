import { Db } from "mongodb";
export interface IContextType {
  getDb: Promise<void | Db>;
  token: string;
}
