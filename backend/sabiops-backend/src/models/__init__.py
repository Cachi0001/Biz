from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()
from .user import User
from .customer import Customer
from .product import Product
from .invoice import Invoice
from .payment import Payment
from .expense import Expense
from .sale import Sale
from .referral import ReferralWithdrawal