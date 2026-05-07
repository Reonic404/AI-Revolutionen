-- Create Database if not exists
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'AI_Slutprojekt')
BEGIN
    CREATE DATABASE [AI_Slutprojekt];
END
GO

USE [AI_Slutprojekt];
GO

-- Create Comments table if not exists
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Comments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Comments] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(100) NOT NULL,
        [Text] NVARCHAR(MAX) NOT NULL,
        [Timestamp] DATETIME DEFAULT GETDATE()
    );
END
GO
