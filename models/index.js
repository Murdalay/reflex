import { ReflexModel } from './ReflexModel';
import BlogPost from './BlogPostModel';
import Category from './CategoryModel';
import User from './UserModel';
import Tag from './TagModel';


ReflexModel.registerModels(BlogPost, Category, User, Tag);

export { ReflexModel };
