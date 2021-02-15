import express from "express";

export type AuthorizationHandler = (request: express.Request, response: express.Response, roles?: string[]) => boolean | Promise<boolean>;
export type CurrentUserHandler = (request: express.Request, response: express.Response) => any | Promise<any>;
export type ErrorHandler = (error: any, request: express.Request, response: express.Response, next: express.NextFunction) => void;
export type MiddlewareHandler = (request: express.Request, response: express.Response, next: express.NextFunction) => void;
