import { app } from "../server";

export default function handler(req: any, res: any) {
  req.isVercelApi = true;
  return app(req, res);
}
