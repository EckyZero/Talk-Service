'use strict';

const _routes = require('../../configs/routes.json');
const _md5 = require('md5');
const BaseBuilder = require('../shared/baseBuilder');
const Talk = require('./models/talk');
const Calling = require('../callings/models/calling');


const _elderCallings = ['apostle', 'seventy'];
const _brotherCallings = ['school', 'young men'];
const _sisterCallings = ['young women', 'relief', 'primary'];
const _validTitles = ['president', 'brother', 'sister', 'elder', 'bishop'];

/**
 * Responsible for building Talk objects
 */
class TalkBuilder extends BaseBuilder {
  /**
  * Represents a TalkBuilder object
  * @constructor
  * @param {*} opts - IoC object holding dependencies
  */
  constructor(opts) {
    super(opts);
    this.speakerBuilder = opts.speakerBuilder;
    this.sessionBuilder = opts.sessionBuilder;
    this.objectValidator = opts.objectValidator;
    this.logger = opts.logger;
  }

  /**
   * Build a Talk object from an HTML element
   * @param {jQuery} $ - Parser used to inspect the element
   * @param {HTMLElement} el - the target HTMLElement to parse
   * @return {Talk} - a talk object
   */
  build($, el) {
    const talk = {};

    talk.title = this._title($, el);
    talk.speaker = this._speaker($, el);
    talk.session = this._session($, el);
    talk.detailUrl = this._url($, el);
    // const talk = Talk.build({
    //   title: this._title($, el),
    //   speaker: this._speaker($, el),
    //   session: this._session($, el),
    //   detailUrl: this._url($, el),
    // });
    // return Talk.build(talk);
    return talk;
  }

  /**
   * Append more information about the speaker and session to the talk
   * @param {jQuery} $ - Parser used to inspect the element
   * @param {Talk} talk - The talk to be appended to
   * @return {Talk} - original talk appended with more speaker and session indo
   */
  appendDetails($, talk) {
    const conf = this.sessionBuilder.buildConferenceDetails($, talk.title);
    const role = this._role($);
    const title = this._speakerTitle($);

    talk.session.name = conf.sessionName;
    talk.sessionOrder = conf.sessionOrder;
    talk.session.conferenceOrder = conf.conferenceOrder;

    talk.description = this._description($);
    talk.quote = this._quote($);
    talk.thumbnailUrl = this._thumbnail($);
    talk.speaker.calling.role = role;
    talk.speaker.calling.title = title;
    talk.speaker.calling.uid = _md5(`${title}-${role}`);

    // Assign composite identifiers to ensure uniqueness
    const sessionIdentifier = `${talk.session.conference.timeOfYear} - ${conf.sessionName}`
    const speakerIdentifier = `${talk.session.conference.timeOfYear} - ${talk.speaker.person.preferredName}`;
    const talkIdentifier = `${speakerIdentifier} - ${talk.title}`

    talk.session.uid = _md5(sessionIdentifier);
    talk.speaker.uid = _md5(speakerIdentifier);
    talk.uid = _md5(talkIdentifier);

    return talk;
    // return Talk.build(talk);
  }

  /**
   * Build multiple talk objects using jQuery
   * @param {jQuery} $ - Parser used to inspect the element
   * @return {Array} - An array of talk objects
   */
  buildMany($) {
    let results = [];

    results = $('.lumen-tile').map((i, el) => {
      return this.build($, el);
    }).get();

    return results;
  }

  /**
   * Parse the url of the talk's content
   * @param {jQuery} $ - Parser used to inspect the element
   * @param {HTMLElement} el - the target HTMLElement to parse
   * @return {string} - string representation of the talk's content url
   */
  _url($, el) {
    return _routes.BASE_URL + $(el)
        .find('.lumen-tile__title')
        .find('a')[0].attribs.href;
  }

  /**
   * Parse the title of the talk
   * @param {jQuery} $ - Parser used to inspect the element
   * @param {HTMLElement} el - the target HTMLElement to parse
   * @return {string} - string title of the talk
   */
  _title($, el) {
    return $(el)
        .find('.lumen-tile__title')
        .find('a')[0].firstChild.data
        .trim();
  }

  /**
   * Parse the speaker of the talk
   * @param {jQuery} $ - Parser used to inspect the element
   * @param {HTMLElement} el - the target HTMLElement to parse
   * @return {Speaker} - the speaker of the talk
   */
  _speaker($, el) {
    return this.speakerBuilder.build($, el);
  }

  /**
   * Parse the session of the talk
   * @param {jQuery} $ - Parser used to inspect the element
   * @param {HTMLElement} el - the target HTMLElement to parse
   * @return {Session} - the session the talk was given in
   */
  _session($, el) {
    return this.sessionBuilder.build($, el);
  }

  /**
   * Parse the thumbnail of the talk
   * @param {jQuery} $ - Parser used to inspect the element
   * @param {HTMLElement} el - the target HTMLElement to parse
   * @return {string} - string thumbnail url of the talk
   */
  _thumbnail($) {
    return $('head > meta:nth-child(7)')[0].attribs.content;
  }

  /**
   * Get the calling of the speaker (ex: Young Men's General President, etc.)
   * @param {jQuery} $ - Parser used to inspect the element
   * @return {string} - the role of speaker
   */
  _role($) {
    let role = $('.author-role')[0] ?
      $('.author-role')[0].firstChild.data : $('#p2')[0].firstChild.data;

    if (role === undefined || role === null) {
      return '';
    }

    if (role.length > 60) {
      role = 'President of The Church of Jesus Christ of Latter-day Saints';
    }
    return role;
  }

  /**
   * Get a highlighted quote from the talk
   * @param {jQuery} $ - Parser used to inspect the element
   * @param {HTMLElement} el - the target HTMLElement to parse
   * @return {string} - a quote from the talk
   */
  _quote($) {
    return $('.kicker')[0] ?
        $('.kicker')[0].firstChild.data.trim() : null;
  }

  /**
   * Get a short summary of the talk's contents
   * @param {jQuery} $ - Parser used to inspect the element
   * @param {HTMLElement} el - the target HTMLElement to parse
   * @return {string} - short summary of the talk
   */
  _description($) {
    return $('head > meta:nth-child(6)')[0].attribs.content;
  }

  /**
   * Get the speaker' title (Brother, Sister, etc.)
   * @param {jQuery} $ - Parser used to inspect the element
   * @param {HTMLElement} el - the target HTMLElement to parse
   * @return {string} - the title of the speaker
   */
  _speakerTitle($) {
    let title;

    const role = this._role($);
    const name = super.tryGetChildDataWithSelectors($, '.author-name', '#p1');

    // If we know the name, parse for the appropriate title
    if (this.objectValidator.isString(name)) {
      const nameElements = name.split(' ');
      const matchingNames = nameElements.filter(
          (el) => this.objectValidator.arrayIncludesValue(_validTitles, el));

      if (matchingNames.length > 0) {
        title = matchingNames[0];
        return title;
      }
    }

    // If we still don't know the title, parse the role for organizations
    if (this.objectValidator.isString(role)) {
      if (this.objectValidator.arrayIncludesValue(_brotherCallings, role)) {
        title = Calling.TITLES.BROTHER;
        return title;
      // eslint-disable-next-line max-len
      } else if (this.objectValidator.arrayIncludesValue(_sisterCallings, role)) {
        title = Calling.TITLES.SISTER;
        return title;
      // eslint-disable-next-line max-len
      } else if (this.objectValidator.arrayIncludesValue(_elderCallings, role)) {
        title = Calling.TITLES.ELDER;
        return title;
      }

      // If we still don't know the name, compare against a comprehensive list
      const roleElements = role.split(' ');
      const matchingRoles = roleElements.filter(
          (el) => this.objectValidator.arrayIncludesValue(_validTitles, el));

      if (matchingRoles.length > 0) {
        title = matchingRoles[0];
        return title;
      }
    }
    return title;
  }

  /**
   * Get references to paginated values
   * @param {jQuery} $ - Parser used to inspect the element
   * @return {Array} - list of relative path urls for paginated resources
   */
  _pages($) {
    const selector = 'body > div > section > nav > ul > li:nth-child(n) > a';
    const attributes = $(selector).map((i, el) => el.attribs.href);
    const pagesRef = Object.values(attributes).filter((el) => typeof el === 'string');
    const pages = [...new Set(pagesRef)];

    return pages;
  }
}

module.exports = TalkBuilder;
