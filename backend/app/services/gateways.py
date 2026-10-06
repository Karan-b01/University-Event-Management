from abc import ABC, abstractmethod
from typing import Optional


# ==========================================
# Email Gateway Interface & Mock Adapter
# ==========================================

class IEmailGateway(ABC):
    """Interface for Email Gateway adapter."""

    @abstractmethod
    def send_email(self, recipient: str, subject: str, body: str) -> bool:
        """Send an email to a given recipient."""
        pass

    @abstractmethod
    def send_welcome_email(self, recipient: str, user_name: str) -> bool:
        """Send a welcome email upon user registration."""
        pass


class EmailGateway(IEmailGateway):
    """Mock implementation of EmailGateway for prototype and testing."""

    def send_email(self, recipient: str, subject: str, body: str) -> bool:
        print(f"[EmailGateway] Sending email to: '{recipient}' | Subject: '{subject}' | Content: '{body}'")
        return True

    def send_welcome_email(self, recipient: str, user_name: str) -> bool:
        subject = "Welcome to University Event Management System!"
        body = f"Hello {user_name},\n\nYour account has been successfully created. Welcome aboard!"
        return self.send_email(recipient, subject, body)


# ==========================================
# SMS Gateway Interface & Mock Adapter
# ==========================================

class ISMSGateway(ABC):
    """Interface for SMS Gateway adapter."""

    @abstractmethod
    def send_sms(self, phone: str, message: str) -> bool:
        """Send an SMS message to a phone number."""
        pass

    @abstractmethod
    def send_otp(self, phone: str, otp_code: str) -> bool:
        """Send an OTP code for multi-factor authentication."""
        pass


class SMSGateway(ISMSGateway):
    """Mock implementation of SMSGateway for prototype and testing."""

    def send_sms(self, phone: str, message: str) -> bool:
        print(f"[SMSGateway] Sending SMS to: '{phone}' | Message: '{message}'")
        return True

    def send_otp(self, phone: str, otp_code: str) -> bool:
        print(f"[SMSGateway] Sending OTP to {phone}: {otp_code}")
        return True


# ==========================================
# CAPTCHA Gateway Interface & Mock Adapter
# ==========================================

class ICAPTCHAGateway(ABC):
    """Interface for CAPTCHA verification service."""

    @abstractmethod
    def verify(self, captcha_token: Optional[str]) -> bool:
        """Verify the user-submitted CAPTCHA response token."""
        pass


class CAPTCHA(ICAPTCHAGateway):
    """Mock implementation of CAPTCHA gateway."""

    def verify(self, captcha_token: Optional[str]) -> bool:
        # In mock mode, treat empty or dummy token as passed
        print(f"[CAPTCHA] Verifying CAPTCHA token: '{captcha_token}' -> Status: Verified")
        return True


# ==========================================
# Payment Gateway Interface & Mock Adapter
# ==========================================

import time
import uuid
from typing import Dict, Any


class IPaymentGateway(ABC):
    """Interface for University Payment Gateway adapter."""

    @abstractmethod
    def process_payment(self, amount: float, account_details: Dict[str, Any]) -> Dict[str, str]:
        """Process financial disbursement to a vendor or recipient."""
        pass


class UniversityPaymentGatewayAdapter(IPaymentGateway):
    """
    Mock adapter simulating University Core Banking / ERP payment gateway.
    Simulates network latency and issues unique transaction references.
    """

    def process_payment(self, amount: float, account_details: Dict[str, Any]) -> Dict[str, str]:
        print(f"[UniversityPaymentGateway] Initiating payment of ${amount:.2f} to account: {account_details}")
        # Simulate network latency as specified
        time.sleep(1)
        txn_id = f"TXN-MOCK-{uuid.uuid4().hex[:12].upper()}"
        print(f"[UniversityPaymentGateway] Payment SUCCESS. Transaction Reference: {txn_id}")
        return {
            "status": "success",
            "transaction_id": txn_id
        }


# Global gateway singleton instances for dependency injection
email_gateway = EmailGateway()
sms_gateway = SMSGateway()
captcha_service = CAPTCHA()
payment_gateway = UniversityPaymentGatewayAdapter()

