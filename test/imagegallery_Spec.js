/**
 * Image gallery tests.
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


import { ImageGalleryBase, TraditionalImageGallery } from '../src/imagegallery.js';
import { Title } from '../src/title.js';
import { MWParser } from '../src/mwparser.js';
import { HtmlCompareMatchers } from './test_utils.js';
import { calcThumbnailSize } from '../src/utils.js';


describe('TraditionalImageGallery tests', function() {
    beforeEach(function() {
        this.par = new MWParser();
        jasmine.addMatchers(HtmlCompareMatchers);
    });

    it('gallery type factory', function() {
        let ig = ImageGalleryBase.factory('traditional');
        expect(ig).toBeInstanceOf(TraditionalImageGallery);
    });

    function cfg_makeThumb(title, width=false, height=false, doNotZoomIn=false) {
            let w, h, url = title.getImageUrl()

            if(title.getPrefixedText() == 'File:Lorem Image 1.jpg' | title.getPrefixedText() == 'File:Lorem Image 2.jpg')
                [w, h] = [622, 940];
            else
                return false;

            if((width !== false || height !== false) && width < w) {
                [w, h] = calcThumbnailSize(w, h, width, height);
                url = title.getThumbUrl(w);
            }

            return {
                url,
                width: w,
                height: h
            };
        }

    it('simple gallery test', function() {
        let ig = ImageGalleryBase.factory('traditional', this.par);
        ig.add(Title.newFromText('File:Lorem Image 1.jpg', this.par.parserConfig, Title.NS_FILE),
            /* label */ 'Lorem ipsum label 1', /* alt */ 'Lorem ipsum alt',
            /* link */ Title.newFromText('Lorem ipsum link', this.par.parserConfig).getFullURL());
        ig.add(Title.newFromText('File:Lorem Image 2.jpg', this.par.parserConfig, Title.NS_FILE),
            /* label */ 'Lorem ipsum label 2', /* alt */ '', /* link */ 'https://lorem.ipsum.pl');
        ig.add(Title.newFromText('File:Lorem Image 3.jpg', this.par.parserConfig, Title.NS_FILE),
            /* label */ 'Lorem ipsum label 3');

        expect(ig.images.length).toEqual(3);

        ig.images.forEach(img => {
            expect(img.title).toBeInstanceOf(Title);
            expect(img.title.getPrefixedText()).toMatch(/File:Lorem Image \d\.jpg/);
        });

        // images not exists
        let result = ig.toHTML();
        expect(result).htmlToBeEqual(`<ul class="gallery mw-gallery-traditional">
<li class="gallerybox" style="width: 155px">
<div style="width: 155px">
<div class="thumb" style="height: 150px;">Lorem Image 1.jpg</div>

<div class="gallerytext">
Lorem ipsum label 1
</div></div></li><li class="gallerybox" style="width: 155px">
<div style="width: 155px">
<div class="thumb" style="height: 150px;">Lorem Image 2.jpg</div>

<div class="gallerytext">
Lorem ipsum label 2
</div></div></li><li class="gallerybox" style="width: 155px">
<div style="width: 155px">
<div class="thumb" style="height: 150px;">Lorem Image 3.jpg</div>

<div class="gallerytext">
Lorem ipsum label 3
</div></div></li>
</ul>`);

        this.par.parserConfig.makeThumb = cfg_makeThumb;

        result = ig.toHTML();
        expect(result).htmlToBeEqual(`<ul class="gallery mw-gallery-traditional">
<li class="gallerybox" style="width: 155px">
<div style="width: 155px">
<div class="thumb" style="width: 150px;">
<div style="margin: 15px auto;">
<a href="//en.wikipedia.org/w/index.php?title=Lorem_ipsum_link"><img alt="Lorem ipsum alt" src="/images/thumb/6/64/Lorem_Image_1.jpg/79px-Lorem_Image_1.jpg" width="79" height="120" decoding="async" srcset="/images/thumb/6/64/Lorem_Image_1.jpg/119px-Lorem_Image_1.jpg 1.5x, /images/thumb/6/64/Lorem_Image_1.jpg/158px-Lorem_Image_1.jpg 2x"></a>
</div></div>
<div class="gallerytext">
Lorem ipsum label 1
</div></div></li><li class="gallerybox" style="width: 155px">
<div style="width: 155px">
<div class="thumb" style="width: 150px;">
<div style="margin: 15px auto;">
<a href="https://lorem.ipsum.pl"><img alt="" src="/images/thumb/6/69/Lorem_Image_2.jpg/79px-Lorem_Image_2.jpg" width="79" height="120" decoding="async" srcset="/images/thumb/6/69/Lorem_Image_2.jpg/119px-Lorem_Image_2.jpg 1.5x, /images/thumb/6/69/Lorem_Image_2.jpg/158px-Lorem_Image_2.jpg 2x"></a>
</div></div>
<div class="gallerytext">
Lorem ipsum label 2
</div></div></li><li class="gallerybox" style="width: 155px">
<div style="width: 155px">
<div class="thumb" style="height: 150px;">Lorem Image 3.jpg</div>

<div class="gallerytext">
Lorem ipsum label 3
</div></div></li>
</ul>`);
    });

    it('image without alt and label', function() {
        let ig = ImageGalleryBase.factory('traditional', this.par);
        ig.add(Title.newFromText('File:Lorem Image 1.jpg', this.par.parserConfig, Title.NS_FILE),
            /* label */ '', /* alt */ '');

        this.par.parserConfig.makeThumb = cfg_makeThumb;

        let result = ig.toHTML();
        expect(result).htmlToBeEqual(`<ul class="gallery mw-gallery-traditional">
<li class="gallerybox" style="width: 155px">
<div style="width: 155px">
<div class="thumb" style="width: 150px;">
<div style="margin: 15px auto;">
<a href="//en.wikipedia.org/w/index.php?title=File%3ALorem_Image_1.jpg" class="image">
<img alt="Lorem Image 1.jpg" src="/images/thumb/6/64/Lorem_Image_1.jpg/79px-Lorem_Image_1.jpg" width="79" height="120" decoding="async" srcset="/images/thumb/6/64/Lorem_Image_1.jpg/119px-Lorem_Image_1.jpg 1.5x, /images/thumb/6/64/Lorem_Image_1.jpg/158px-Lorem_Image_1.jpg 2x"></a>
</div></div>
<div class="gallerytext">
</div></div></li>
</ul>`);
    });

});

