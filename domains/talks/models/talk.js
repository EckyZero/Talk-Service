'use strict';

const BaseModel = require('../../shared/baseModel');

/**
 * The Talk object given at a conference
 */
class Talk extends BaseModel {
    title;
    description;
    quote;
    sessionOrder;
    session;
    speaker;
    thumbnailUrl;
    detailUrl;

    /**
     * Initialize an instance of a Talk
     * @constructor
     */
    constructor() {
      super();
    }
}

module.exports = Talk;
