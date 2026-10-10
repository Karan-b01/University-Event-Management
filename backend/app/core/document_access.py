"""Shared role-based policy for viewing proposal documents and receipts."""


RECEIPT_VIEW_ROLES = {"Student", "Student Organizer", "Finance Officer", "Admin"}
KNOWN_DOCUMENT_ROLES = {
    "Student",
    "Student Organizer",
    "Faculty Advisor",
    "Security Officer",
    "Finance Officer",
    "Resource Manager",
    "Admin",
}


def can_view_document(user, document) -> bool:
    """Posters are visible to signed-in campus roles; receipts have a narrower audience."""
    user_roles = {role.role_name for role in getattr(user, "roles", [])}
    document_type = getattr(document, "type", None)

    if document_type == "Poster":
        return bool(user_roles.intersection(KNOWN_DOCUMENT_ROLES))
    if document_type == "Receipt":
        return bool(user_roles.intersection(RECEIPT_VIEW_ROLES))
    return bool(user_roles.intersection(KNOWN_DOCUMENT_ROLES))
