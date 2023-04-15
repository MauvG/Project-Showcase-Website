'''API v1 for the database'''
from fastapi import APIRouter, Request, Depends, HTTPException, status, Response, UploadFile, Form
from fastapi.responses import FileResponse
from PIL import Image
import os
# from fastapi.templating import Jinja2Templates
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer

from sqlalchemy import func
from sqlalchemy.future import select
from sqlalchemy.sql import and_
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from passlib.context import CryptContext
from uuid import uuid4
from jose import jwt, JWTError

from db import get_session, init_db
from models import User, UserSignup, UserUpdate, Token, Project, Tag, Category, CategoryWithTags, ProjectWithUserAndTags, ProjectFull, ProjectUpdate, UserInfo, ProjectFeatured, project_tags, TagCount, CategoryUpdate, TagUpdate, ProjectCount, CategoryCreate, TagCreate

from datetime import timedelta, datetime

from typing import List

import asyncio

import re

API_PREFIX = "/api/v1"
router = APIRouter(prefix=API_PREFIX)

# openssl rand -hex 32
SECRET_KEY = "d8e632e42229356dbbcd5fdc366a05e9bfaca0193ba016e4fd6cf03307d90241"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

SALT = "fa3e1b071f78d55d833c2df51a3089e5"

DEFAULT_PAGE = 1

DEFAULT_PAGE_SIZE = 30
MAX_PAGE_SIZE = 50
# jinja2 template for server side render html
# templates = Jinja2Templates(directory="templates")

# it is tokenUrl instead of kebab-case token_url to unify with OAuth2 scheme
# tokenUrl is to specify OpenAPI route address of token endpoint for frontend login
# OAuthPasswordBearer extracts Bearer from Authorization Header and send it to tokenUrl
oauth2_bearer = OAuth2PasswordBearer(tokenUrl=API_PREFIX + "/user/token")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_current_time():
    return datetime.utcnow()


@router.on_event("startup")
async def startup():
    await init_db()


# for further refactor the functions down below should be moved to a utils package
def is_admin(user: User) -> bool:
    return True if user.role else False


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password + SALT, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def unauthorized_error(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                         detail=detail,
                         headers={"WWW-Authenticate": "Bearer"})


def _create_token(
    data: dict, expires: timedelta = timedelta(minutes=15)) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + expires
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def _decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise unauthorized_error("Could not validate credentials")


# warning: this function returns all the users without limit and offset
async def get_all_users_db(session: AsyncSession = Depends(
    get_session)) -> List[User]:
    result = await session.execute(select(User))
    return result.scalars().all()


async def get_user_with_id_db(
    user_id: int, session: AsyncSession = Depends(get_session)) -> User:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_with_email_db(
    email: str, session: AsyncSession = Depends(get_session)) -> User:
    result = await session.execute(select(User).where(User.email == email))

    return result.scalar_one_or_none()

    # users = result.scalars().all()
    # return [User(**user.__dict__) for user in users]


# get current user from token by decoding it
async def get_current_user(token: str = Depends(oauth2_bearer),
                           session: AsyncSession = Depends(
                               get_session)) -> User:
    error = unauthorized_error("Could not validate credentials")
    payload = _decode_token(token=token)

    username = payload.get("sub")
    if not username:
        raise error
    expires = payload.get("exp")
    if expires < int(datetime.utcnow().timestamp()):
        raise unauthorized_error("Token expired")

    user = await get_user_with_email_db(username, session)
    if user is None:
        raise unauthorized_error(
            f"User {username} not found, probably email changed")

    if user.password_version != payload.get("password_version"):
        raise unauthorized_error("Password updated, please login again")

    if user.role != payload.get("role"):
        raise unauthorized_error("Role updated, please login again")

    return user


@router.post("/user/signup", response_model=Token)
async def create_user(user: UserSignup,
                      session: AsyncSession = Depends(get_session)):
    if not user.email or not re.match(
            r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", user.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Email invalid")

    existed_user = await get_user_with_email_db(user.email, session)
    if existed_user is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Email registered already")

    if not user.password or len(user.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password invalid, should be at least 8 characters")

    new_user = User(email=user.email,
                    hashed_password=get_password_hash(user.password + SALT),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    password_version=0,
                    id=str(uuid4()))

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    token = _create_token(
        data={
            "sub": user.username,
            "password_version": 0,
            "role": 0
        },
        expires=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    response = {
        "access_token":
        token,
        "token_type":
        "bearer",
        "email":
        user.email,
        "role":
        0,
        "expires_at":
        datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    return response


@router.put("/user/update/{id}", response_model=User)
async def update_user(user: UserUpdate,
                      id: str,
                      session: AsyncSession = Depends(get_session),
                      current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    r = await session.execute(select(User).where(User.id == id))
    user_to_update = r.scalar_one_or_none()

    if not user_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="User not found")

    if not is_admin(current_user) and user_to_update.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="non-admin user can only update self")

    data = user.dict(exclude_unset=True)

    for k, v in data.items():
        if v is not None:
            if k == "password":
                if len(v) < 8:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=
                        "Password invalid, should be at least 8 characters")
                if get_password_hash(v +
                                     SALT) == user_to_update.hashed_password:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Password not changed")
                user_to_update.password_version += 1
                k, v = "hashed_password", get_password_hash(v + SALT)
            elif k == "email":
                result = await session.execute(
                    select(User).where(User.email == v))
                searched_user = result.scalar_one_or_none()
                if searched_user and searched_user.id != current_user.id:  # if the queried user with same email is not user self
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"email {v} registered already")

            setattr(user_to_update, k, v)

    user_to_update.updated_at = datetime.utcnow()

    session.add(user_to_update)
    await session.commit(
    )  # flush is actually not needed here since commit will flush automatically
    await session.refresh(user_to_update)
    user_data = user_to_update.__dict__
    user_data.pop("hashed_password")
    return user_data


@router.delete('/user/delete/{id}')
async def delete_user(id: str,
                      session: AsyncSession = Depends(get_session),
                      current_user: User = Depends(get_current_user)):
    if not id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid user id")

    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    result = await session.execute(select(User).where(User.id == id))
    original_instance = result.scalar_one_or_none()

    if not original_instance:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="User not found")

    if not is_admin(current_user) and original_instance.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Non-admin user can only delete self")

    await session.delete(original_instance)
    await session.commit()
    await session.flush()
    return {"status": "success"}


@router.post('/user/token',
             summary="Create access and refresh tokens for user",
             response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends(),
                session: AsyncSession = Depends(get_session)):
    user = await get_user_with_email_db(form.username, session)
    if not user or not verify_password(form.password, user.hashed_password):
        raise unauthorized_error("Incorrect username or password")

    token = _create_token(
        data={
            "sub": form.username,
            "password_version": user.password_version,
            "role": user.role
        },
        expires=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    response = {
        "access_token":
        token,
        "token_type":
        "bearer",
        "email":
        user.email,
        "role":
        user.role,
        "expires_at":
        datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    return response


@router.get("/user/info", response_model=UserInfo)
async def get_current_user_info(current_user: User = Depends(get_current_user),
                                session: AsyncSession = Depends(get_session)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    r = await session.execute(select(User).where(User.id == current_user.id))
    return r.scalar_one_or_none()


@router.get("/admin/users/total")
async def admin_get_total_users(
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Only admin can access this endpoint")

    count = (await session.execute(select(func.count(User.id))
                                   )).scalar_one_or_none()
    if not count:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="No user found")

    return {"total": count}


@router.get("/admin/users", response_model=List[UserInfo])
async def admin_get_all_users(response: Response,
                              per_page: int = DEFAULT_PAGE_SIZE,
                              page: int = DEFAULT_PAGE,
                              session: AsyncSession = Depends(get_session),
                              current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Only admin can access this endpoint")

    count = (await session.execute(select(func.count(User.id))
                                   )).scalar_one_or_none()
    response.headers['X-Total-Count'] = str(count)
    response.headers['X-Total-Pages'] = str(count // per_page +
                                            (1 if count % per_page else 0))

    result = await session.execute(
        select(User).offset(max((page - 1) * per_page,
                                0)).limit(min(per_page, MAX_PAGE_SIZE)))
    users = result.scalars().all()
    ids = [user.id for user in users]

    tasks = [get_user_projects_count_by_id(id, session) for id in ids]
    users_projects_counts = await asyncio.gather(*tasks)

    results = [
        UserInfo(id=user.id,
                 created_at=user.created_at,
                 email=user.email,
                 username=user.username if user.username else None,
                 is_active=user.is_active,
                 role=user.role) for user in users
    ]

    for i in range(len(results)):
        results[i].projects_counts = users_projects_counts[i]

    return results


@router.put("/admin/project/live/{id}")
async def toggle_project_is_live(
    id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Only admin can access this endpoint")

    result = await session.execute(select(Project).where(Project.id == id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Project not found")

    project.is_live = not project.is_live
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return {"status": "success", "is_live": project.is_live}


@router.get("/admin/projects/total")
async def admin_get_total_projects(
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Only admin can access this endpoint")

    count = (await session.execute(select(func.count(Project.id))
                                   )).scalar_one_or_none()
    if not count:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="No project found")

    return {"total": count}


@router.get("/admin/projects/total/visit")
async def admin_get_total_projects_visit(
        session: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Only admin can access this endpoint")

    count = (await session.execute(select(func.sum(Project.visit_count))
                                   )).scalar_one_or_none()
    if not count:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="No project found")

    return {"total": count}


@router.get("/admin/projects", response_model=List[ProjectWithUserAndTags])
async def admin_get_all_projects(
    response: Response,
    per_page: int = DEFAULT_PAGE_SIZE,
    page: int = DEFAULT_PAGE,
    is_live: bool = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Only admin can access this endpoint")

    query = select(func.count(Project.id))
    if is_live is not None:
        query = query.where(Project.is_live == is_live)
    count = (await session.execute(query)).scalar_one_or_none()
    response.headers['X-Total-Count'] = str(count)
    response.headers['X-Total-Pages'] = str(count // per_page +
                                            (1 if count % per_page else 0))

    query = select(Project).options(selectinload(Project.user),
                                    selectinload(Project.tags))
    if is_live is not None:
        query = query.where(Project.is_live == is_live)
    query = query.order_by(Project.date.desc()).offset(
        max((page - 1) * per_page, 0)).limit(min(per_page, MAX_PAGE_SIZE))
    result = await session.execute(query)
    return result.scalars().all()


@router.post("/admin/category", response_model=Category)
async def create_category(new_category: CategoryCreate,
                          current_user: User = Depends(get_current_user),
                          session: AsyncSession = Depends(get_session)):
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="only admin can create category")

    if not new_category.categoryName:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="category name is required")

    r = await session.execute(
        select(Category).where(
            Category.categoryName == new_category.categoryName))
    if r.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="category already exists")

    new_category_instance = Category(categoryName=new_category.categoryName)

    session.add(new_category_instance)
    await session.commit()
    await session.refresh(new_category_instance)
    return new_category_instance


@router.put("/admin/category/{id}", response_model=Category)
async def update_category(id: int,
                          updated_category: CategoryCreate,
                          current_user: User = Depends(get_current_user),
                          session: AsyncSession = Depends(get_session)):
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="only admin can update category")

    r = await session.execute(
        select(Category).where(Category.categoryId == id))
    original_instance = r.scalar_one_or_none()
    if not original_instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Category not found")

    for k, v in updated_category.__dict__.items():
        if v is not None:
            setattr(original_instance, k, v)

    session.add(original_instance)
    await session.commit()
    await session.refresh(original_instance)
    return original_instance


@router.delete("/admin/category/{id}")
async def delete_category(id: int,
                          current_user: User = Depends(get_current_user),
                          session: AsyncSession = Depends(get_session)):
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="only admin can delete category")

    r = await session.execute(
        select(Category).where(Category.categoryId == id))
    original_instance = r.scalar_one_or_none()

    if not original_instance:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Category not found")

    await session.delete(original_instance)
    await session.commit()
    await session.flush()
    return {"status": "success"}


@router.post("/admin/tag", response_model=Tag)
async def create_tag(new_tag: TagCreate,
                     current_user: User = Depends(get_current_user),
                     session: AsyncSession = Depends(get_session)):
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="only admin can create category")

    if new_tag.tagNameShort is None:
        new_tag.tagNameShort = new_tag.tagName

    if not new_tag.tagName or not new_tag.tagNameShort:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="tag name and short name are required")

    if (await
            session.execute(select(Tag).where(Tag.tagName == new_tag.tagName)
                            )).scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Tag already exists")

    if not (await session.execute(
            select(Category).where(Category.categoryId == new_tag.categoryId)
    )).scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Category not found")

    new_tag_instance = Tag(
        tagName=new_tag.tagName,
        tagNameShort=new_tag.tagNameShort,
        categoryId=new_tag.categoryId if new_tag.categoryId else None)
    session.add(new_tag_instance)
    await session.commit()
    await session.refresh(new_tag_instance)
    return new_tag_instance


@router.put("/admin/tag/{id}", response_model=TagUpdate)
async def update_tag(id: int,
                     updated_tag: TagUpdate,
                     current_user: User = Depends(get_current_user),
                     session: AsyncSession = Depends(get_session)):
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="only admin can update tag")

    if id != updated_tag.tagId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="id in url and body must match")

    r = await session.execute(select(Tag).where(Tag.tagId == id))
    original_instance = r.scalar_one_or_none()

    if not original_instance:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Tag not found")

    for k, v in updated_tag.__dict__.items():
        if v is not None:
            if k == "categoryId":
                r = await session.execute(
                    select(Category).where(Category.categoryId == v))
                if not r.scalar_one_or_none():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Category not found")

            setattr(original_instance, k, v)

    session.add(original_instance)
    await session.commit()
    await session.refresh(original_instance)
    return original_instance


@router.delete("/admin/tag/{id}")
async def delete_tag(id: int,
                     current_user: User = Depends(get_current_user),
                     session: AsyncSession = Depends(get_session)):
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="only admin can delete tag")

    r = await session.execute(select(Tag).where(Tag.tagId == id))
    original_instance = r.scalar_one_or_none()
    if not original_instance:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Tag not found")

    await session.delete(original_instance)
    await session.commit()
    await session.flush()
    return {"status": "success"}


@router.get("/admin/projects/recent/{n}")
async def get_projects_updated_count_in_n_days(
    n: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)):
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="only admin can get recent projects")

    if n < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="n must be greater than 0")
    # Calculate the start date for the query
    n_days_ago = datetime.utcnow() - timedelta(days=n - 1)

    # Define a subquery to group the projects by date and count the number of projects
    subquery = (select(
        func.date(Project.date).label('date'),
        func.count(Project.id).label('count')).where(
            Project.date >= n_days_ago).group_by(func.date(
                Project.date)).alias())

    # Select the counts of projects updated on each day in the last n days
    query = (select(subquery.c.date,
                    func.coalesce(subquery.c.count,
                                  0).label("count")).order_by(subquery.c.date.desc()))

    # Execute the query and get the results
    r = await session.execute(query)

    results = [{"date": row[0], "count": row[1]} for row in r]
    dates = [result["date"] for result in results]

    for date in range(n):
        date = (n_days_ago + timedelta(days=date)).strftime("%Y-%m-%d")
        if date not in dates:
            results.append({"date": date, "count": 0})

    results.sort(key=lambda x: x["date"])
    return results


@router.get("/admin/tags/popular/{n}", response_model=List[TagCount])
async def get_top_n_popular_tags(
    n: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)):
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="only admin can get popular tags")
    # get the count of each tag
    subquery = (select(project_tags.tag_id,
                       func.count(
                           project_tags.tag_id).label('count')).group_by(
                               project_tags.tag_id).alias('subquery'))
    # select the top 10 most used tags
    query = (select(subquery.c.tag_id, subquery.c.count).order_by(
        subquery.c.count.desc()).limit(n))

    r = await session.execute(query)

    sub_results = [(row[0], row[1]) for row in r]
    results = []
    for sub_result in sub_results:
        r = await session.execute(
            select(Tag).where(Tag.tagId == sub_result[0]))
        tag = r.scalar_one_or_none()
        results.append(TagCount(tag=tag, count=sub_result[1]))

    return results


async def get_user_projects_count_by_id(id: str, session: AsyncSession):
    r = await session.execute(
        select(func.count(Project.id)).where(Project.user_id == id,
                                             Project.is_live == True))
    live_count = r.scalar_one_or_none()

    r = await session.execute(
        select(func.count(Project.id)).where(Project.user_id == id,
                                             Project.is_live == False))
    draft_count = r.scalar_one_or_none()

    r = await session.execute(
        select(func.count(Project.id)).where(Project.user_id == id))
    total_count = r.scalar_one_or_none()

    return ProjectCount(live_count=live_count,
                        draft_count=draft_count,
                        total_count=total_count)


@router.get("/admin/user/{id}/projects",
            response_model=List[ProjectWithUserAndTags])
async def get_projects_by_user_id(
    id: str,
    response: Response,
    per_page: int = DEFAULT_PAGE_SIZE,
    page: int = DEFAULT_PAGE,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)):

    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="only admin can get projects by user id")

    id = id.replace("-", "")
    if len(id) != 32:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid user id")

    count = (await session.execute(
        select(func.count(Project.id)).where(Project.user_id == id)
    )).scalar_one_or_none()
    response.headers['X-Total-Count'] = str(count)
    response.headers['X-Total-Pages'] = str(count // per_page +
                                            (1 if count % per_page else 0))

    result = await session.execute(
        select(Project).options(
            selectinload(Project.user),
            selectinload(Project.tags)).where(Project.user_id == id).offset(
                max((page - 1) * per_page,
                    0)).limit(min(per_page, MAX_PAGE_SIZE)))
    return result.scalars().all()


@router.post("/user/project")
async def create_project(title: str = Form(),
                         link: str = Form(),
                         completionDate: str = Form(),
                         description: str = Form(),
                         content: str = Form(),
                         tags: str = Form(""),
                         imageFile: UploadFile = None,
                         session: AsyncSession = Depends(get_session),
                         current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    data = {
        "title": title,
        "link": link,
        "date": completionDate,
        "description": description,
        "content": content,
        "tags": [int(tagId) for tagId in tags.split(",")] if tags else []
    }
    tags = []
    for tagId in data["tags"]:
        if not isinstance(tagId, int):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Tag must be an integer")
        r = await session.execute(select(Tag).where(Tag.tagId == tagId))
        tag = r.scalar_one_or_none()
        if not tag:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Tag with ID {tagId} not found")
        tags.append(tag)

    data["tags"] = tags
    new_project = Project(**data,
                          id=str(uuid4()),
                          user_id=current_user.id,
                          #date=datetime.utcnow(),
                          user=current_user)

    #TODO refactor to a separate function
    if imageFile:
        tempFilePath = "./database/content/images/temp-" + str(
            new_project.id) + "-" + imageFile.filename
        try:
            contents = imageFile.file.read()
            with open(tempFilePath, 'wb') as f:
                f.write(contents)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            imageFile.file.close()

        try:
            im = Image.open(tempFilePath)
            im.verify()
        except Exception:
            if os.path.exists(tempFilePath):
                os.remove(tempFilePath)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid image file format")
        finally:
            im.close()

        filePath = "./database/content/images/" + str(new_project.id) + ".png"
        try:
            im = Image.open(tempFilePath)
            im.save(filePath)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            im.close()
            if os.path.exists(tempFilePath):
                os.remove(tempFilePath)

    session.add(new_project)
    await session.commit()
    await session.refresh(new_project)
    return new_project


@router.delete("/user/project/{id}")
async def delete_project(id: str,
                         session: AsyncSession = Depends(get_session),
                         current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    r = await session.execute(
        select(Project).options(selectinload(Project.user),
                                selectinload(
                                    Project.tags)).where(Project.id == id))
    originalProject = r.scalar_one_or_none()

    if not originalProject:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Project with ID {id} not found")

    if not is_admin(
            current_user) and originalProject.user.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    await session.delete(originalProject)
    await session.commit()
    await session.flush()
    return {"status": "success"}


@router.put("/user/project/{id}", response_model=ProjectWithUserAndTags)
async def modify_project(project: ProjectUpdate,
                         id: str,
                         session: AsyncSession = Depends(get_session),
                         current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    r = await session.execute(
        select(Project).options(selectinload(Project.user),
                                selectinload(
                                    Project.tags)).where(Project.id == id))
    originalProject = r.scalar_one_or_none()

    if not originalProject:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Project with ID {id} not found")

    if originalProject.user.id != current_user.id and not is_admin(
            current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    data = project.dict(exclude_unset=True)
    for k, v in data.items():
        if v is not None:
            if k == "is_live":
                if not is_admin(current_user):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Unauthorized")
                setattr(originalProject, k, v)
            elif k == "tags":
                tags = []
                for tagId in v:
                    if not isinstance(tagId, int):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"TagId {tagId} must be an integer")
                    r = await session.execute(
                        select(Tag).where(Tag.tagId == tagId))
                    tag = r.scalar_one_or_none()
                    if not tag:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Tag with ID {tagId} not found")
                    tags.append(tag)
                setattr(originalProject, k, tags)
            else:
                setattr(originalProject, k, v)

    session.add(originalProject)
    await session.commit()
    await session.refresh(originalProject)
    return originalProject


@router.get("/user/project/{id}", response_model=ProjectFull)
async def get_project(id: str,
                      session: AsyncSession = Depends(get_session),
                      current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    r = await session.execute(
        select(Project).options(selectinload(Project.user),
                                selectinload(
                                    Project.tags)).where(Project.id == id))
    project = r.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Project with ID {id} not found")

    if not is_admin(current_user) and project.user.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    return project


@router.get("/user/projects", response_model=List[ProjectWithUserAndTags])
async def query_user_projects(
    response: Response,
    start_date: datetime = datetime.min,
    end_date: datetime = Depends(get_current_time),
    per_page: int = DEFAULT_PAGE_SIZE,
    page: int = DEFAULT_PAGE,
    keyword: str = "",
    tags: str = "",
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> List[ProjectWithUserAndTags]:
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")
    if tags:
        try:
            tag_ids = [int(tag) for tag in tags.split(',')]

            r = await session.execute(
                select(Tag).options(joinedload(Tag.category)).filter(
                    Tag.tagId.in_(tag_ids)))
            tagInstances = r.scalars().all()
            for tag in tag_ids:
                if tag not in [
                        tagInstance.tagId for tagInstance in tagInstances
                ]:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Tag with ID {tag} not found")

            r = await session.execute(select(func.count(Category.categoryId)))
            num_categories = r.scalar_one_or_none()

            tag_ids_by_category = [[
                tag.tagId for tag in tagInstances
                if tag.categoryId == categoryId
            ] for categoryId in range(1, num_categories + 1)]

            conditions = []
            for i, tag_list in enumerate(tag_ids_by_category):
                if tag_list:
                    conditions.append(
                        and_(
                            Project.tags.any(
                                and_(Tag.categoryId == (i + 1),
                                     Project.tags.any(
                                         Tag.tagId.in_(tag_list)))), ))

            query = select(func.count(Project.id)).filter(
                Project.user_id == current_user.id,
                Project.title.like(f'%{keyword}%'), Project.date >= start_date,
                Project.date <= end_date)
            query = query.filter(and_(*conditions)) if conditions else query
            count = (await session.execute(query)).scalar_one_or_none()

            query = select(Project).group_by(Project.id).filter(
                Project.user_id == current_user.id,
                Project.title.like(f'%{keyword}%'),
                Project.date >= start_date, Project.date <= end_date).options(
                    selectinload(Project.user), selectinload(
                        Project.tags)).order_by(Project.date.desc()).offset(
                            max((page - 1) * per_page,
                                0)).limit(min(per_page, MAX_PAGE_SIZE))

            query = query.filter(and_(*conditions)) if conditions else query

            r = await session.execute(query)
            response.headers['X-Total-Count'] = str(count)
            response.headers['X-Total-Pages'] = str(count // per_page +
                                                    (1 if count %
                                                     per_page else 0))
            return r.scalars().all()
        except ValueError as e:
            print(e)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Tags must be integers")

    query = select(func.count(
        Project.id)).where(Project.user_id == current_user.id).filter(
            Project.title.like(f'%{keyword}%'), Project.date >= start_date,
            Project.date <= end_date)

    r = await session.execute(query)
    count = r.scalar_one_or_none()

    query = select(Project).where(Project.user_id == current_user.id).filter(
        Project.title.like(f'%{keyword}%'), Project.date >= start_date,
        Project.date <= end_date).options(selectinload(Project.user),
                                          selectinload(Project.tags)).order_by(
                                              Project.date.desc())

    r = await session.execute(
        query.offset(max((page - 1) * per_page,
                         0)).limit(min(per_page, MAX_PAGE_SIZE)))

    response.headers['X-Total-Count'] = str(count)
    response.headers['X-Total-Pages'] = str((count // per_page) +
                                            (1 if count % per_page else 0))
    return r.scalars().all()


@router.get("/project/featured", response_model=ProjectFeatured)
async def get_featured_project(session: AsyncSession = Depends(
    get_session)) -> ProjectFeatured:
    if not id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Project ID is required")

    # == True is required because SQLAlchemy doesn't know how to compare
    r = await session.execute(
        select(Project).options(selectinload(
            Project.tags)).where(Project.is_featured == True).limit(1))

    project = r.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Project not found")

    return project


@router.delete("/project/featured")
async def delete_featured_project(session: AsyncSession = Depends(get_session),
                                  current_user=Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Only admins can set feature projects")

    r = await session.execute(
        select(Project).where(Project.is_featured == True).limit(1))
    projects = r.scalars().all()
    if projects:
        for project in projects:
            project.is_featured = False
            session.add(project)

        await session.commit()
        for project in projects:
            await session.refresh(project)

    return {"status": "success"}


@router.put("/project/featured/{id}")
async def set_featured_project(id: str,
                               session: AsyncSession = Depends(get_session),
                               current_user=Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unauthorized")

    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Only admins can set feature projects")

    if not id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Project ID is required")

    project = (await session.execute(select(Project).where(Project.id == id)
                                     )).scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Project not found")

    if project.is_featured:
        return project
    # set project to featured and unset all other projects
    r = await session.execute(
        select(Project).where(Project.is_featured == True))
    featured_projects = r.scalars().all()
    for p in featured_projects:
        p.is_featured = False
        session.add(p)

    r = await session.execute(select(Project).where(Project.id == id))
    project = r.scalar_one_or_none()
    project.is_featured = True
    session.add(project)
    await session.commit()

    for p in featured_projects:
        await session.refresh(p)
    await session.refresh(project)

    return project


@router.get("/project/{id}/image")
async def get_project_image(id: str):
    filePath = "./database/content/images/" + id + ".png"
    if os.path.exists(filePath):
        return FileResponse(filePath)
    else:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Project image not found")


@router.get("/project/{id}", response_model=ProjectFull)
async def get_project_by_id(
        id: str,
        session: AsyncSession = Depends(get_session),
) -> ProjectFull:
    if not id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Project ID is required")

    r = await session.execute(
        select(Project).where(Project.id == id).options(
            selectinload(Project.user), selectinload(Project.tags)))
    project = r.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Project not found")

    project.visit_count += 1
    session.add(project)
    await session.commit()
    await session.refresh(project)

    return project


@router.get("/projects", response_model=List[ProjectWithUserAndTags])
async def query_all_live_projects(
    response: Response,
    start_date: datetime = datetime.min,
    end_date: datetime = Depends(get_current_time),
    per_page: int = DEFAULT_PAGE_SIZE,
    page: int = DEFAULT_PAGE,
    keyword: str = "",
    tags: str = "",
    session: AsyncSession = Depends(get_session),
) -> List[ProjectWithUserAndTags]:

    if tags:
        try:
            tag_ids = [int(tag) for tag in tags.split(',')]

            r = await session.execute(
                select(Tag).options(joinedload(Tag.category)).filter(
                    Tag.tagId.in_(tag_ids)))
            tagInstances = r.scalars().all()
            for tag in tag_ids:
                if tag not in [
                        tagInstance.tagId for tagInstance in tagInstances
                ]:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Tag with ID {tag} not found")

            r = await session.execute(select(func.count(Category.categoryId)))
            num_categories = r.scalar_one_or_none()

            tag_ids_by_category = [[
                tag.tagId for tag in tagInstances
                if tag.categoryId == categoryId
            ] for categoryId in range(1, num_categories + 1)]

            conditions = []
            for i, tag_list in enumerate(tag_ids_by_category):
                if tag_list:
                    conditions.append(
                        and_(
                            Project.tags.any(
                                and_(Tag.categoryId == (i + 1),
                                     Project.tags.any(
                                         Tag.tagId.in_(tag_list)))), ))

            query = select(func.count(Project.id)).filter(
                Project.is_live == True,
                Project.title.like(f'%{keyword}%'), Project.date >= start_date,
                Project.date <= end_date)
            query = query.filter(and_(*conditions)) if conditions else query
            count = (await session.execute(query)).scalar_one_or_none()

            query = select(Project).group_by(Project.id).filter(
                Project.is_live == True,
                Project.title.like(f'%{keyword}%'),
                Project.date >= start_date, Project.date <= end_date).options(
                    selectinload(Project.user), selectinload(
                        Project.tags)).order_by(Project.date.desc()).offset(
                            max((page - 1) * per_page,
                                0)).limit(min(per_page, MAX_PAGE_SIZE))

            query = query.filter(and_(*conditions)) if conditions else query

            r = await session.execute(query)
            response.headers['X-Total-Count'] = str(count)
            response.headers['X-Total-Pages'] = str(count // per_page +
                                                    (1 if count %
                                                     per_page else 0))
            return r.scalars().all()
        except ValueError as e:
            print(e)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Tags must be integers")

    query = select(func.count(Project.id)).filter(
        Project.is_live == True,
        Project.title.like(f'%{keyword}%'), Project.date >= start_date,
        Project.date <= end_date)
    count = (await session.execute(query)).scalar_one_or_none()

    response.headers['X-Total-Count'] = str(count)
    response.headers['X-Total-Pages'] = str(count // per_page +
                                            (1 if count % per_page else 0))

    r = await session.execute(
        select(Project).filter(
            Project.is_live == True,
            Project.title.like(f'%{keyword}%'),
            Project.date >= start_date, Project.date <= end_date).options(
                selectinload(Project.user),
                selectinload(Project.tags)).order_by(
                    Project.date.desc()).offset(max(
                        (page - 1) * per_page,
                        0)).limit(min(per_page, MAX_PAGE_SIZE)))
    return r.scalars().all()


@router.get("/tag/{tagId}", response_model=Tag)
async def fetch_tag(request: Request,
                    session: AsyncSession = Depends(get_session),
                    tagId: int = 0) -> List[Tag]:
    r = await session.execute(
        select(Tag).filter_by(**request.query_params._dict, tagId=tagId))
    tag = r.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Tag not found")
    return tag


@router.get("/tags", response_model=List[CategoryWithTags])
async def fetch_tags(session: AsyncSession = Depends(
    get_session)) -> List[CategoryWithTags]:

    r = await session.execute(
        select(Category).options(selectinload(Category.tags)).order_by(
            Category.categoryId))
    return r.scalars().all()
