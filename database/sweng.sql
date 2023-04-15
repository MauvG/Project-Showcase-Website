PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE project_tags (
	project_id CHAR(32) NOT NULL, 
	tag_id INTEGER NOT NULL, 
	PRIMARY KEY (project_id, tag_id), 
	FOREIGN KEY(project_id) REFERENCES projects (id), 
	FOREIGN KEY(tag_id) REFERENCES tags ("tagId")
);
INSERT INTO project_tags VALUES('3f361d4fbd0f4be281bb63f99fab3f86',1);
INSERT INTO project_tags VALUES('3f361d4fbd0f4be281bb63f99fab3f86',2);
INSERT INTO project_tags VALUES('dcb17f6f63a64da5b210fcf433c24f1e',1);
INSERT INTO project_tags VALUES('dcb17f6f63a64da5b210fcf433c24f1e',2);
INSERT INTO project_tags VALUES('061546b6c4264e4b9fa8aceba244f92d',3);
INSERT INTO project_tags VALUES('71835b1099ac44d0baf1e8a8522c5d72',1);
INSERT INTO project_tags VALUES('71835b1099ac44d0baf1e8a8522c5d72',2);
INSERT INTO project_tags VALUES('71835b1099ac44d0baf1e8a8522c5d72',11);
INSERT INTO project_tags VALUES('d69cad8782c34f149ea11b38b0c94575',1);
INSERT INTO project_tags VALUES('d69cad8782c34f149ea11b38b0c94575',2);
INSERT INTO project_tags VALUES('d69cad8782c34f149ea11b38b0c94575',11);
INSERT INTO project_tags VALUES('d153f1aad75d496db27c7ba41c1d7508',1);
INSERT INTO project_tags VALUES('d153f1aad75d496db27c7ba41c1d7508',2);
INSERT INTO project_tags VALUES('d153f1aad75d496db27c7ba41c1d7508',11);
INSERT INTO project_tags VALUES('4e1dcb9925304676b377be2da090d07d',1);
INSERT INTO project_tags VALUES('4e1dcb9925304676b377be2da090d07d',2);
INSERT INTO project_tags VALUES('333d0f27febb4fd7a913469d0879c57a',1);
INSERT INTO project_tags VALUES('333d0f27febb4fd7a913469d0879c57a',3);
INSERT INTO project_tags VALUES('190551be832543c2b79c6138bb450b5a',1);
INSERT INTO project_tags VALUES('190551be832543c2b79c6138bb450b5a',2);
INSERT INTO project_tags VALUES('190551be832543c2b79c6138bb450b5a',11);
INSERT INTO project_tags VALUES('64a6da8e439f4f5096b9977fa86bd90f',11);
INSERT INTO project_tags VALUES('1f6fba5b0bf64df184a2fdc8aa5d1188',11);
INSERT INTO project_tags VALUES('f310a380a27a4a18b6b0a44ac6813fdf',11);
INSERT INTO project_tags VALUES('05cc70bf9b074c08befb7578ceae1741',11);
INSERT INTO project_tags VALUES('edb2967a66cf4b4e8aad031c7bc48110',11);
INSERT INTO project_tags VALUES('b5903cc39e524ba1880a76ab2e3dcc83',11);
INSERT INTO project_tags VALUES('1ef091f29e0c4d799c59f55bb76f6dbc',11);
CREATE TABLE categories (
	"categoryId" INTEGER NOT NULL, 
	"categoryName" VARCHAR NOT NULL, 
	PRIMARY KEY ("categoryId")
);
INSERT INTO categories VALUES(1,'Programming Languages');
INSERT INTO categories VALUES(2,'Sponsor');
CREATE TABLE tags (
	"tagId" INTEGER NOT NULL, 
	"tagName" VARCHAR NOT NULL, 
	"tagNameShort" VARCHAR NOT NULL, 
	"categoryId" INTEGER, 
	PRIMARY KEY ("tagId"), 
	FOREIGN KEY("categoryId") REFERENCES categories ("categoryId")
);
INSERT INTO tags VALUES(1,'Python','py',1);
INSERT INTO tags VALUES(2,'Java','java',1);
INSERT INTO tags VALUES(3,'C++','cpp',1);
INSERT INTO tags VALUES(11,'Trinity','Trinity',2);
INSERT INTO tags VALUES(12,'IBM','IBM',2);
CREATE TABLE users (
	email VARCHAR(255) NOT NULL, 
	username VARCHAR, 
	id CHAR(32) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	hashed_password VARCHAR, 
	password_version INTEGER NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	role INTEGER NOT NULL, 
	PRIMARY KEY (id)
);
INSERT INTO users VALUES('sus1@tcd.ie','string','ea1964dcd0bb4c959666bae528db2a4f','2023-03-01 22:05:31.492154','2023-03-01 22:21:15.354633','$2b$12$YY9JGNOS1SqIU/nSTD4q1OFSyl7t4L9PQZkVKu6Zh87lsZPTcN4AK',1,1,1);
INSERT INTO users VALUES('bob@gmail.com',NULL,'cfd748f2123341d480121ac0a0d32aad','2023-03-24 16:24:36.902368','2023-03-24 16:24:36.902368','$2b$12$zlnViCtolcMuPh3CJ3/Qy.TQZ4vowjOCwPuKEFsQ23p60EfPD0Y9.',0,1,0);
CREATE TABLE projects (
	title VARCHAR NOT NULL, 
	link VARCHAR NOT NULL, 
	description VARCHAR NOT NULL, 
	content VARCHAR NOT NULL, 
	date DATETIME NOT NULL, 
	id CHAR(32) NOT NULL, 
	is_live BOOLEAN NOT NULL, 
	user_id CHAR(32) NOT NULL, visit_count integer default 0, is_featured boolean default false, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
INSERT INTO projects VALUES('string','string','string','string','2023-03-01 22:07:58.387000','4e1dcb9925304676b377be2da090d07d',0,'ea1964dcd0bb4c959666bae528db2a4f',3,1);
INSERT INTO projects VALUES('string','string','string','string','2023-03-01 22:07:58.387000','333d0f27febb4fd7a913469d0879c57a',0,'ea1964dcd0bb4c959666bae528db2a4f',0,0);
INSERT INTO projects VALUES('string','string','string','string','2023-03-01 22:07:58.387000','190551be832543c2b79c6138bb450b5a',0,'ea1964dcd0bb4c959666bae528db2a4f',0,0);
INSERT INTO projects VALUES('string','string','string','string','2023-03-01 22:07:58.387000','1f6fba5b0bf64df184a2fdc8aa5d1188',0,'ea1964dcd0bb4c959666bae528db2a4f',0,0);
INSERT INTO projects VALUES('string','string','string','string','2023-03-01 22:07:58.387000','f310a380a27a4a18b6b0a44ac6813fdf',0,'ea1964dcd0bb4c959666bae528db2a4f',0,0);
COMMIT;
