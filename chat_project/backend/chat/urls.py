from . import views
from django.urls import path

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('current_user/', views.get_current_user, name='current_user'),
    path('users/', views.get_users, name='get_users'),
    path('messages/<int:user_id>/', views.get_messages, name='get_messages'),
    path('send_message/', views.send_message, name='send_message'),
]