export interface NovaService { name: string; init(): Promise<void>; }
export interface NovaRuntimeStatus { status: string; error?: string; }
export interface NovaMinecraftVersion { version: string; loader?: string; }
export interface NovaInstance { name: string; version: string; loader?: string; }
export interface NovaJavaRuntime { path: string; version: string; }
export interface NovaDownloadTask { id: string; status: string; }
export interface NovaServiceResult<T> { success: boolean; data?: T; error?: string; }