import {
  intArg,
  makeSchema,
  nonNull,
  objectType,
  stringArg,
  inputObjectType,
  arg,
  asNexusMethod,
  enumType,
} from 'nexus'
import { DateTimeResolver } from 'graphql-scalars'
import { Context } from './context'

export const DateTime = asNexusMethod(DateTimeResolver, 'date')

const Query = objectType({
  name: 'Query',
  definition(t) {
    t.nonNull.list.nonNull.field('allUsers', {
      type: 'User',
      args: {
        nameFilter: stringArg(),
        skip: intArg(),   // 1
        take: intArg(),   // 1
      },
      resolve: (_parent, args, context: Context) => {
        const where = args.nameFilter
            ? {
              OR: [
                { name: { contains: args.nameFilter } }
              ],
            }
            : {};
        return context.prisma.user.findMany({
          where,
            skip: args?.skip as number | undefined,    // 2
            take: args?.take as number | undefined,    // 2
      })
      },
    })

    t.nonNull.list.nonNull.field('allTransactions', {
      type: 'Transaction',
      args: {
        searchAll: stringArg(),
        skip: intArg(),   // 1
        take: intArg(),   // 1
      },
      resolve: (_parent, args, context: Context) => {
        const where = args.searchAll
            ? {
              OR: [
                { accountId: { contains: args.searchAll } },
                { reference: { contains: args.searchAll } },
                { category: { contains: args.searchAll } },
              ],
            }
            : {};
        return context.prisma.transaction.findMany({
          where,
          skip: args?.skip as number | undefined,    // 2
          take: args?.take as number | undefined,    // 2
        })
      },
    })

    t.nonNull.list.nonNull.field('allCategories', {
      type: 'Category',
      args: {
        skip: intArg(),   // 1
        take: intArg(),   // 1
      },
      resolve: (_parent, args, context: Context) => {
        return context.prisma.category.findMany({
          skip: args?.skip as number | undefined,    // 2
          take: args?.take as number | undefined,    // 2
        })
      },
    })

    t.nonNull.list.nonNull.field('allAccounts', {
      type: 'Account',
      args: {
        skip: intArg(),   // 1
        take: intArg(),   // 1
      },
      resolve: (_parent, args, context: Context) => {
        return context.prisma.account.findMany({
          skip: args?.skip as number | undefined,    // 2
          take: args?.take as number | undefined,    // 2
        })
      },
    })

    t.nullable.field('postById', {
      type: 'Post',
      args: {
        id: intArg(),
      },
      resolve: (_parent, args, context: Context) => {
        return context.prisma.post.findUnique({
          where: { id: args.id || undefined },
        })
      },
    })

    t.nonNull.list.nonNull.field('feed', {
      type: 'Post',
      args: {
        searchString: stringArg(),
        skip: intArg(),
        take: intArg(),
        orderBy: arg({
          type: 'PostOrderByUpdatedAtInput',
        }),
      },
      resolve: (_parent, args, context: Context) => {
        const or = args.searchString
          ? {
              OR: [
                { title: { contains: args.searchString } },
                { content: { contains: args.searchString } },
              ],
            }
          : {}

        return context.prisma.post.findMany({
          where: {
            published: true,
            ...or,
          },
          take: args.take || undefined,
          skip: args.skip || undefined,
          orderBy: args.orderBy || undefined,
        })
      },
    })

    t.list.field('draftsByUser', {
      type: 'Post',
      args: {
        userUniqueInput: nonNull(
          arg({
            type: 'UserUniqueInput',
          }),
        ),
      },
      resolve: (_parent, args, context: Context) => {
        return context.prisma.user
          .findUnique({
            where: {
              id: args.userUniqueInput.id || undefined,
              email: args.userUniqueInput.email || undefined,
            },
          })
          .posts({
            where: {
              published: false,
            },
          })
      },
    })
  },
})

const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.nonNull.field('signupUser', {
      type: 'User',
      args: {
        data: nonNull(
          arg({
            type: 'UserCreateInput',
          }),
        ),
      },
      resolve: (_, args, context: Context) => {
        const postData = args.data.posts?.map((post) => {
          return { title: post.title, content: post.content || undefined }
        })
        return context.prisma.user.create({
          data: {
            name: args.data.name,
            email: args.data.email,
            posts: {
              create: postData,
            },
          },
        })
      },
    })

    t.field('createDraft', {
      type: 'Post',
      args: {
        data: nonNull(
          arg({
            type: 'PostCreateInput',
          }),
        ),
        authorEmail: nonNull(stringArg()),
      },
      resolve: (_, args, context: Context) => {
        return context.prisma.post.create({
          data: {
            title: args.data.title,
            content: args.data.content,
            author: {
              connect: { email: args.authorEmail },
            },
          },
        })
      },
    })

    t.field('togglePublishPost', {
      type: 'Post',
      args: {
        id: nonNull(intArg()),
      },
      resolve: async (_, args, context: Context) => {
        try {
          const post = await context.prisma.post.findUnique({
            where: { id: args.id || undefined },
            select: {
              published: true,
            },
          })
          return context.prisma.post.update({
            where: { id: args.id || undefined },
            data: { published: !post?.published },
          })
        } catch (e) {
          throw new Error(
            `Post with ID ${args.id} does not exist in the database.`,
          )
        }
      },
    })

    t.field('incrementPostViewCount', {
      type: 'Post',
      args: {
        id: nonNull(intArg()),
      },
      resolve: (_, args, context: Context) => {
        return context.prisma.post.update({
          where: { id: args.id || undefined },
          data: {
            viewCount: {
              increment: 1,
            },
          },
        })
      },
    })

    t.field('deletePost', {
      type: 'Post',
      args: {
        id: nonNull(intArg()),
      },
      resolve: (_, args, context: Context) => {
        return context.prisma.post.delete({
          where: { id: args.id },
        })
      },
    })
  },
})

const User = objectType({
  name: 'User',
  definition(t) {
    t.nonNull.int('id')
    t.string('name')
    t.nonNull.string('email')
  },
})

const Post = objectType({
  name: 'Post',
  definition(t) {
    t.nonNull.int('id')
    t.nonNull.field('createdAt', { type: 'DateTime' })
    t.nonNull.field('updatedAt', { type: 'DateTime' })
    t.nonNull.string('title')
    t.string('content')
    t.nonNull.boolean('published')
    t.nonNull.int('viewCount')
    t.field('author', {
      type: 'User',
      resolve: (parent, _, context: Context) => {
        return context.prisma.post
          .findUnique({
            where: { id: parent.id || undefined },
          })
          .author()
      },
    })
  },
})

const SortOrder = enumType({
  name: 'SortOrder',
  members: ['asc', 'desc'],
})

const PostOrderByUpdatedAtInput = inputObjectType({
  name: 'PostOrderByUpdatedAtInput',
  definition(t) {
    t.nonNull.field('updatedAt', { type: 'SortOrder' })
  },
})

const UserUniqueInput = inputObjectType({
  name: 'UserUniqueInput',
  definition(t) {
    t.int('id')
    t.string('email')
  },
})

const PostCreateInput = inputObjectType({
  name: 'PostCreateInput',
  definition(t) {
    t.nonNull.string('title')
    t.string('content')
  },
})

const UserCreateInput = inputObjectType({
  name: 'UserCreateInput',
  definition(t) {
    t.nonNull.string('email')
    t.string('name')
    t.list.nonNull.field('posts', { type: 'PostCreateInput' })
  },
})

const Account = objectType({
  name: 'Account',
  definition(t) {
    t.nonNull.string('id')
    t.string('name')
    t.string('bank')
  },
})

const Transaction = objectType({
  name: 'Transaction',
  definition(t) {
    t.nonNull.string('id')
    t.string('accountId')
    t.string('categoryId')
    t.string('category')
    t.string('reference')
    t.float('amount')
    t.string('currency')
    t.date('date')
  },
})

const Category = objectType({
  name: 'Category',
  definition(t) {
    t.nonNull.string('id')
    t.string('name')
    t.string('color')
  },
})


export const schema = makeSchema({
  types: [
    Query,
    Mutation,
    Post,
    User,
    Category,
    Account,
    Transaction,
    UserUniqueInput,
    UserCreateInput,
    PostCreateInput,
    SortOrder,
    PostOrderByUpdatedAtInput,
    DateTime,
  ],
  outputs: {
    schema: __dirname + '/../schema.graphql',
    typegen: __dirname + '/generated/nexus.ts',
  },
  contextType: {
    module: require.resolve('./context'),
    export: 'Context',
  },
  sourceTypes: {
    modules: [
      {
        module: '@prisma/client',
        alias: 'prisma',
      },
    ],
  },
})
