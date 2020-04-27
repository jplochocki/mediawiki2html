/**
 * Image gallery.
 *
 *
 * MIT License
 *
 * Copyright (c) 2020 Jacek Płochocki <jplochocki@op.pl>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


import { Sanitizer } from './sanitizer.js';


export class ImageGalleryBase {
    static factory(mode, parser, showFilename, caption, perRow, widths, heights) {
        // TODO: more languages
        return new TraditionalImageGallery(parser, showFilename, caption, perRow, widths, heights);
    }

    constructor(parser, showFilename, caption, perRow, widths, heights) {
        this.parser = parser;
        this.showFilename = showFilename;
        this.caption = caption;
        this.perRow = perRow ? parseInt(perRow, 10) : 0;
        this.widths = widths ? parseInt(widths, 10) : 120;
        this.heights = heights? parseInt(heights, 10) : 120;

        this.images = [];
    }


    /**
     * Add an image to the gallery.
     *
     * @param Title title
     * @param String [label]
     * @param String [alt]
     * @param String [link]
     * @param Object [handlerOpts]
     */
    add(title, label='', alt='', link='', handlerOpts={}) {
        this.images.push({title, label, alt, link, handlerOpts});
    }


    toHTML() {
        return '';
    }
};


class TraditionalImageGallery extends ImageGalleryBase {
    constructor(parser, showFilename, caption, perRow, widths, heights) {
        super(parser, showFilename, caption, perRow, widths, heights);

        this.thumbPadding = 30; // How much padding the thumb has between the image and the inner div that contains the border.
        this.GBPadding = 5; // gallerybox LI padding
        this.GBBorders = 8; // Get how much extra space the borders around the image takes up

        this.allPadding = this.thumbPadding + this.GBPadding + this.GBBorders;
    }

    toHTML() {
        let gallAttrs = {
            'class': 'gallery mw-gallery-traditional',
            style: ''
        };

        if(this.perRow > 0) {
            let maxWidth = this.perRow * (this.widths + this.allPadding);

            // _width is ignored by any sane browser. IE6 doesn't know max-width so it uses _width instead
            gallAttrs.style = `max-width: ${ maxWidth }px; _width: ${ maxWidth }px;`;
        }

        let out = `<ul ${ Sanitizer.safeEncodeTagAttributes(gallAttrs) }>\n`;
        if(this.caption)
            out += `<li class="gallerycaption">${ this.caption }</li>\n`;

        this.images.forEach(({title, label, alt, link, handlerOpts}) => {
            let thumb = this.parser.parserConfig.makeThumb(title, this.widths, this.heights);
            let thumbHtml = '';

            if(thumb === false) // We're dealing with a non-image, spit out the name and be done with it
                thumbHtml = `<div class="thumb" style="height: ${ this.thumbPadding + this.heights }'px;">${ Sanitizer.escapeHTML(title.getText()) }</div>\n`;
            else {
                let imgParams = {
                    'alt': alt,
                    src: thumb.url,
                    width: thumb.width,
                    height: thumb.height,
                    decoding: 'async'
                };

                if(alt == '' && caption == '')
                    imgParams.alt = title.getText();

                if(this.parser.parserConfig.wgResponsiveImages) { // Linker::processResponsiveImages
                    let w15 = Math.round(imgParams.width * 1.5);
                    let w20 = Math.round(imgParams.width * 2);

                    let h15 = Math.round(imgParams.height * 1.5);
                    let h20 = Math.round(imgParams.height * 2);

                    let t15 = this.parser.parserConfig.makeThumb(title, w15, h15);
                    let t20 = this.parser.parserConfig.makeThumb(title, w20, h20);

                    imgParams.srcset = '';
                    if(t15 && t15.url != thumb.url)
                        imgParams.srcset += t15.url + ' 1.5x';
                    if(t20 && t20.url != thumb.url && t15.url != t20.url)
                        imgParams.srcset += (imgParams.srcset == ''? '' : ', ') + t20.url + ' 2x';
                }

                let linkAttrs = {
                    href: title.getFullURL(),
                    'class': 'image'
                };
                if(link)
                    linkAttrs.href = link;

                const vpad = (this.thumbPadding + this.heights - thumb.height) / 2;

                thumbHtml = `<div class="thumb" style="width: ${ this.widths + this.thumbPadding }px;">
<div style="margin: ${ vpad }px auto;">
<a ${ Sanitizer.safeEncodeTagAttributes(linkAttrs) }><img ${ Sanitizer.safeEncodeTagAttributes(imgParams) }></a>
</div></div>`;
            }

            let galleryText = (this.showFilename ? this.getCaptionHtml(title) : '') + label;
            // TODO: ShowDimensions / ShowBytes

            let gbWidth = this.widths + this.thumbPadding + this.GBPadding;

            // double wrapping (div inside li) as in MediaWiki
            out += `<li class="gallerybox" style="width: ${ gbWidth }px">
<div style="width: ${ gbWidth }px">
${ thumbHtml }
<div class="gallerytext">
${ galleryText }
</div></div></li>`;
        });

        return out + '\n</ul>';
    }


    getCaptionHtml(title) {
        let linkAttrs = {
            href: title.getFullURL(),
            'class': 'galleryfilename galleryfilename-truncate',
            title: title.getPrefixedText()
        };

        // long file name truncated by CSS only
        return `<a ${ Sanitizer.safeEncodeTagAttributes(linkAttrs) }>${ Sanitizer.escapeHTML(title.getText()) }</a>\n`;
    }
};

