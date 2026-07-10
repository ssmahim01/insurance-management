import { MessageType } from "../modules/message/message.interface";
import { MessageService } from "../modules/message/message.service";

export const sendSMS = async (
  phone: string,
  message: string,
  type: MessageType
) => {

  await MessageService.createMessage({
    phone,
    message,
    type
  });

  console.log("\n========== SMS ==========");
  console.log("Phone:", phone);
  console.log("Message:", message);
  console.log("=========================\n");

  return true;
};