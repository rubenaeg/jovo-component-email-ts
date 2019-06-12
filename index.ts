import { Component } from 'jovo-framework';

export class EMAIL extends Component {
    handler: { [key: string]: any };
    config: { [key: string]: any };
    pathToI18n: string;
    constructor(config: { [key: string]: any }) {
        super(config);
        this.handler = require('./src/handler');
        this.config = require('./src/config');
        this.pathToI18n = './src/i18n/';
    }
}