export abstract class BaseMigration {
    abstract version: number;
    abstract up(data: any): any;
    abstract down(data: any): any;
}