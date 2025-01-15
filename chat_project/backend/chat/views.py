from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ChatMessage

@api_view(['POST'])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(username=username, password=password)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'user': {'id': user.id, 'username': user.username},
        'token': token.key
    })

@api_view(['POST'])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': {'id': user.id, 'username': user.username},
            'token': token.key
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    return Response({'id': request.user.id, 'username': request.user.username})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    users = User.objects.exclude(id=request.user.id).values('id', 'username')
    return Response(list(users))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, user_id):
    other_user = User.objects.get(id=user_id)
    messages = ChatMessage.objects.filter(
        (Q(sender=request.user) & Q(receiver=other_user)) |
        (Q(sender=other_user) & Q(receiver=request.user))
    ).order_by('timestamp')
    
    messages_list = [
        {
            'id': msg.id,
            'sender': msg.sender.username,
            'content': msg.content,
            'timestamp': msg.timestamp.isoformat()
        } for msg in messages
    ]
    
    return Response(messages_list)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    receiver = User.objects.get(id=request.data['receiver_id'])
    content = request.data['content']
    
    message = ChatMessage.objects.create(sender=request.user, receiver=receiver, content=content)
    
    return Response({
        'id': message.id,
        'sender': message.sender.username,
        'content': message.content,
        'timestamp': message.timestamp.isoformat()
    })

