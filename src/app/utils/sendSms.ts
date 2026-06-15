export const sendSMS = async (
  phone: string,
  message: string,
) => {
  console.log("\n========== SMS ==========");
  console.log("Phone:", phone);
  console.log("Message:", message);
  console.log("=========================\n");

  return true;
};