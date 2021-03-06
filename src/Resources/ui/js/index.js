import smoothscroll from 'smoothscroll-polyfill';
import 'svgxuse';

import {get} from './services/xhr';
import cookies from './services/cookies';
import datalayers from './services/datalayers';
import {querySelectorAllArray} from './utils';
import {
    dispatch,
    LOAD_COOKIE_VALUE_TO_STATE,
    SET_VISIBILITY_SCOPE_TO_NONE,
    SET_VISIBILITY_SCOPE_TO_COOKIE_BAR,
    SET_VISIBILITY_SCOPE_TO_COOKIE_PAGE_PRIVACY,
    SET_VISIBILITY_SCOPE_TO_COOKIE_PAGE_PREFERENCES
} from './state';

import CookieBar from './components/CookieBar';
import CookieModal from './components/CookieModal';
import BackDrop from './components/BackDrop';
import AcceptAllCookiesButton from './components/AcceptAllCookiesButton';
import Notification from './components/Notification';
import CloseCookieModalButton from './components/CloseCookieModalButton';
import ToggleButton from './components/ToggleButton';
import ToggleLink from './components/ToggleLink';
import AcceptSomeCookiesButton from './components/AcceptSomeCookiesButton';
import CloseDetailButton from './components/CloseDetailButton';
import ToTopButton from './components/ToTopButton';
import CollapsibleContent from './components/CollapsibleContent';
import Tab from './components/Tab';
import CookieModalTrigger from './components/CookieModalTrigger';

import {TOGGLE_BUTTON_CLASS_IDENTIFIER} from './config/toggleButton.config';
import {TOGGLE_LINK_IDENTIFIER} from './config/toggleLink.config';
import {COLLAPSIBLE_CONTENT_IDENTIFIER} from './config/collapsibleContent.config';
import {KMCC_PAGE_IDENTIFIER, KMCC_CONTENT_URL_ITEM_IDENTIFIER} from './config/page.config';
import {TAB_IDENTIFIER} from './config/tab.config';
import {COOKIE_MODAL_TRIGGER_IDENTIFIER} from './config/cookieModalTrigger.config';

export const getKmccCookies = cookies.getKmccCookies;
export const hasAllowedDataLayers = cookies.hasAllowedDataLayers;

// For projects that do not use bundlers on their own.
window.kmcc = {
    getKmccCookies,
    hasAllowedDataLayers
};

switch(true) {
    case document.readyState === 'interactive':
    case document.readyState === 'complete':
        bootstrapCookieConsent();
    default:
        document.addEventListener('DOMContentLoaded', bootstrapCookieConsent);
}

function bootstrapCookieConsent() {
    // First check if the cookiebar SHOULD init.
    let cookiebarWrapper = document.querySelector('kuma-cookie-bar');
    if (cookiebarWrapper === null || cookiebarWrapper.innerHTML === '') {
        return;
    }
    // This is to polyfill the window.scroll(); functionality.
    // Currently in CSSOM working draft. (March 2018)
    smoothscroll.polyfill();
    // This Boolean is needed to determine some functionality of close buttons.
    // (The modal is not open on the cookie page.)
    let isOnCookiePage = document.getElementById(KMCC_PAGE_IDENTIFIER) !== null;
    // First check the current settings for the cookies.
    let kmccCookieContent = getKmccCookieContent();
    let cookiesHaveBeenSet = typeof kmccCookieContent !== 'undefined'
    // Send data about cookie settings (if they are set) to GTM.
    cookies.sendActivateCookiesEventToGTM();
    // Send data about type of visitor to GTM
    datalayers.sendIpAddressEvent();

    if (isOnCookiePage) {
        initializeBasicComponents(isOnCookiePage);
        new CookieModal({
            configuration: {isOnCookiePage}
        });
        initializeExtendedComponents(isOnCookiePage);

        if (cookiesHaveBeenSet) {
            dispatch(LOAD_COOKIE_VALUE_TO_STATE, kmccCookieContent);
            dispatch(SET_VISIBILITY_SCOPE_TO_COOKIE_PAGE_PRIVACY);
        } else {
            dispatch(SET_VISIBILITY_SCOPE_TO_COOKIE_PAGE_PREFERENCES);
        }

    } else {
        initializeBasicComponents(isOnCookiePage);

        if (cookiesHaveBeenSet) {
            dispatch(SET_VISIBILITY_SCOPE_TO_NONE);
        } else {
            dispatch(SET_VISIBILITY_SCOPE_TO_COOKIE_BAR);
        }


        // Get the content URL for the modal.
        let contentUrl = document.getElementById(KMCC_CONTENT_URL_ITEM_IDENTIFIER).value;
        get(contentUrl).then(({response: modalContent}) => {
            
            new CookieModal({
                configuration: {
                    modalContent,
                    isOnCookiePage
                }
            });
            initializeExtendedComponents(isOnCookiePage);
        });
    }
}

function initializeBasicComponents(isOnCookiePage) {
    new CookieBar();
    new AcceptAllCookiesButton();
    new Notification();
    new BackDrop({
        configuration: {isOnCookiePage}
    });
    new CloseCookieModalButton({
        configuration: {isOnCookiePage}
    });
    initializeCookieModalTriggers();
}

function initializeExtendedComponents(isOnCookiePage) {
    initializeTabs();
    initializeToggleButtons();
    initializeCollapsibleContent();
    initializeToggleLinks();
    // new CookieModal();
    new AcceptSomeCookiesButton();
    new CloseDetailButton();
    new ToTopButton({
        controlledElement: document.getElementById('kmcc-modal-content')
    });
}

function initializeToggleButtons() {
    let allToggleButtons = querySelectorAllArray(`.${TOGGLE_BUTTON_CLASS_IDENTIFIER}`);
    allToggleButtons.forEach((toggleButton) => {
        // This is the key on the state.
        if (toggleButton.hasAttribute('rel')) {
            new ToggleButton({
                vdom: toggleButton,
                configuration: {
                    stateIdentifier: toggleButton.getAttribute('rel')
                }
            });
        } else {
            throw new Error('A toggle button should have an identifier that maps its value to the state.');
        }
    });
}

function initializeCookieModalTriggers() {
    let allCookieModalTriggers = querySelectorAllArray(`.${COOKIE_MODAL_TRIGGER_IDENTIFIER}`);
    allCookieModalTriggers.forEach((cookieModalTrigger) => {
        new CookieModalTrigger({
            vdom: cookieModalTrigger
        });
    })
}

function initializeToggleLinks() {
    let allToggleLinks = querySelectorAllArray(TOGGLE_LINK_IDENTIFIER);
    allToggleLinks.forEach((toggleLink) => {
        new ToggleLink({
            vdom: toggleLink
        });
    });
}

function initializeCollapsibleContent() {
    const allCollapsibleContent = querySelectorAllArray(COLLAPSIBLE_CONTENT_IDENTIFIER);
    allCollapsibleContent.forEach((collapsibleContent) => {
        new CollapsibleContent({
            vdom: collapsibleContent
        });
    });
}

function initializeTabs() {
    let allTabs = querySelectorAllArray(TAB_IDENTIFIER);
    allTabs.forEach((element) => {
        new Tab({vdom: element});
    });
}

function getKmccCookieContent() {
    return cookies.getKmccCookies();
}
