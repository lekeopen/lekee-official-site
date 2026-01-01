// Email Template for Contact Form Submission
// This template is designed to be sent FROM: service@lekee.cc TO: contact@lekeopen.com

export const generateEmailHtml = (data: {
  name: string;
  contact: string;
  type: string;
  message: string;
  submissionTime: string;
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
    .header { background-color: #1366FF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px 20px; background-color: #f9f9f9; }
    .field { margin-bottom: 20px; background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #1366FF; }
    .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; font-weight: bold; }
    .value { font-size: 16px; font-weight: 500; color: #1a1a1a; }
    .message-box { background: white; padding: 20px; border-radius: 4px; border: 1px solid #e5e5e5; margin-top: 10px; }
    .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
    .highlight { color: #FF8A00; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;">官网新留言提醒</h2>
      <p style="margin:5px 0 0 0; opacity: 0.9;">来自: ${data.name}</p>
    </div>
    
    <div class="content">
      <div class="field">
        <div class="label">咨询类型</div>
        <div class="value highlight">${data.type}</div>
      </div>

      <div class="field">
        <div class="label">客户姓名</div>
        <div class="value">${data.name}</div>
      </div>

      <div class="field">
        <div class="label">联系方式</div>
        <div class="value">${data.contact}</div>
      </div>

      <div class="field" style="border-left-color: #FF8A00;">
        <div class="label">留言内容</div>
        <div class="value message-box">
          ${data.message.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <div style="text-align: right; color: #888; font-size: 12px; margin-top: 20px;">
        提交时间: ${data.submissionTime}
      </div>
    </div>

    <div class="footer">
      <p>此邮件由系统自动发送，请勿直接回复发件人 (service@lekee.cc)</p>
      <p>&copy; ${new Date().getFullYear()} Leke Tech System Notification</p>
    </div>
  </div>
</body>
</html>
  `;
};

// 纯文本版本作为备用
export const generateEmailText = (data: {
  name: string;
  contact: string;
  type: string;
  message: string;
  submissionTime: string;
}) => {
  return `
【官网新留言提醒】

咨询类型: ${data.type}
客户姓名: ${data.name}
联系方式: ${data.contact}
提交时间: ${data.submissionTime}

----------------------------------------
留言内容:
${data.message}
----------------------------------------

此邮件由系统自动生成。
  `;
};
