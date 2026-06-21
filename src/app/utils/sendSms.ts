import { MessageService } from "../modules/message/message.service";

export const sendSMS = async (
  phone: string,
  message: string,
) => {

  await MessageService.createMessage({
    phone,
    message,
  });

  console.log("\n========== SMS ==========");
  console.log("Phone:", phone);
  console.log("Message:", message);
  console.log("=========================\n");

  return true;
};