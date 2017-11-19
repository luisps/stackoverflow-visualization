CREATE TABLE public.votes (
  "PostId" int8 NOT NULL,
  "VoteTypeId" int2 NOT NULL,
  "CreationDate" date NOT NULL
);

CREATE TABLE public.posts (
  "Id" int8 NOT NULL,
  "PostTypeId" int2 NOT NULL,
  "ParentId" int8 NOT NULL,
  "CreationDate" date NOT NULL,
  "ViewCount" int8 NOT NULL,
  "AnswerCount" int8 NOT NULL,
  "CommentCount" int8 NOT NULL,
  "OwnerUserId" int8 NOT NULL,
  "Tags" text NOT NULL
);

CREATE TABLE public.comments (
  "PostId" int8 NOT NULL,
  "CreationDate" date NOT NULL,
  "OwnerUserId" int8 NOT NULL
);
