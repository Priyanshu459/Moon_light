export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  createdAt?: string;
}

export interface Media {
  id: string;
  url: string;
  type: 'image' | 'video';
  postId: string | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
}

export interface Post {
  id: string;
  content: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  media: Media[];
  hasLiked?: boolean;
  _count?: {
    likes: number;
    comments: number;
  };
}

export interface Notification {
  id: string;
  recipientId: string;
  triggerUserId: string | null;
  postId: string | null;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW';
  read: boolean;
  createdAt: string;
  triggerUser?: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  post?: Pick<Post, 'id' | 'content'> & { media?: Media[] };
}
