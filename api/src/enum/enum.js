/**
 * Enum Constants
 * Matches FastAPI src/enum/enum.py structure
 */

const ProfileAccessibilityEnum = {
  public: 'public',
  private: 'private'
};

const UserTypeEnum = {
  admin: 'admin',
  customer: 'customer',
  business: 'business'
};

const ThemeEnum = {
  light: 'light',
  dark: 'dark',
  dynamic: 'dynamic'
};

const AuthTypeEnum = {
  phone: 'phone',
  google: 'google',
  apple: 'apple',
  anonymous: 'anonymous',
  email: 'email'
};

const LanguageStatusEnum = {
  en: 'en',
  ar: 'ar',
  ind: 'ind',
  fr: 'fr',
  es: 'es',
  de: 'de'
};

const UserStatusAuthEnum = {
  INACTIVE: 'Inactive',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  DELETED: 'Deleted'
};

module.exports = {
  ProfileAccessibilityEnum,
  UserTypeEnum,
  ThemeEnum,
  AuthTypeEnum,
  LanguageStatusEnum,
  UserStatusAuthEnum
};

