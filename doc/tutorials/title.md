Usage examples
--------------

```javascript
const parser = new MWParser();
const t = Title.newFromText('Lorem:ipsum', parser.parserConfig);

getPrefixedText
getFullURL
```


Namespace list
--------------

|||||
|:-------:|:-------:|:-------:|:-------:|
| `Title.NS_MAIN` (__default__) | `Title.NS_TALK` | `Title.NS_USER` | `Title.NS_USER_TALK` |
| `Title.NS_PROJECT` | `Title.NS_PROJECT_TALK` | `Title.NS_FILE` | `Title.NS_FILE_TALK` |
| `Title.NS_MEDIAWIKI` | `Title.NS_MEDIAWIKI_TALK` | `Title.NS_TEMPLATE` | `Title.NS_TEMPLATE_TALK` |
| `Title.NS_HELP` | `Title.NS_HELP_TALK` | `Title.NS_CATEGORY` | `Title.NS_CATEGORY_TALK` |
| `Title.NS_SPECIAL` ||||



Main functions
--------------

|Basic|Namespaces|Titles|Interwiki|Fragment|Images|Subpages|
|:-----|:-----|:-----|:-----|:-----|:-----|:-----|
|{@link Title#equals equals}|{@link Title#getNsIndex getNsIndex}|{@link Title#getPrefixedText getPrefixedText}|{@link Title#isExternal isExternal}|{@link Title#hasFragment hasFragment}|{@link Title#getImageUrl getImageUrl}|{@link Title#hasSubpages hasSubpages}|
|{@link Title#exists exists}|{@link Title#getNsText getNsText}|{@link Title#getFullURL getFullURL}|{@link Title#isValidInterwiki isValidInterwiki}|{@link Title#getFragment getFragment}|{@link Title#getThumbUrl getThumbUrl}|{@link Title#getSubpageText getSubpageText}|
|{@link Title#isKnown isKnown}|{@link Title#getNamespace getNamespace}|{@link Title#getDBkey getDBkey}|{@link Title#getInterwiki getInterwiki}| |{@link Title#getImageUploadUrl getImageUploadUrl}|{@link Title#getSubpage getSubpage}|
|{@link Title#isAlwaysKnown isAlwaysKnown}| |{@link Title#getText getText}| | | |{@link Title#getSubpages getSubpages}|
| | |{@link Title#getPrefixedDBkey getPrefixedDBkey}| | | |{@link Title#getBaseText getBaseText}|
| | |{@link Title#getPartialURL getPartialURL}| | | | |
| | |{@link Title#getEditURL getEditURL}| | | | |

