"""Papéis de utilizador (BE-05): valores do enum alinhados à API / OpenAPI."""

from app.models.user import UserRole


def test_user_role_enum_values_include_admin() -> None:
    assert UserRole.store_admin.value == "store_admin"


def test_user_role_extended_roles_exist_for_future_rbac() -> None:
    """Operador / leitura: reservados para convites e permissões por rota (futuro)."""
    assert UserRole.store_operator.value == "store_operator"
    assert UserRole.store_viewer.value == "store_viewer"
