describe('Sanitizer.decodeTagAttributes', function() {
    it('basic tests', function() {
        let result = Sanitizer.decodeTagAttributes(`class="wikitable" style="width: 100%;"`);
        expect(result).toEqual({
            class: 'wikitable',
            style: 'width: 100%;'
        });

        result = Sanitizer.decodeTagAttributes(`single_quote='luctus cursus risus' no_quote=lorem no_value`);
        expect(result).toEqual({
            single_quote: 'luctus cursus risus',
            no_quote: 'lorem',
            no_value: ''
        });

        result = Sanitizer.decodeTagAttributes(`invalid_name*='luctus cursus risus' UPPER_CASE_NAME="lorem"`);
        expect(result).toEqual({
            upper_case_name: 'lorem'
        });
    });
});



describe('Test Sanitizer.validateTagAttributes()', function() {
    beforeEach(function() {
    });

    it('', function() {
        let result = Sanitizer.validateTagAttributes({
            class: 'wikitable',
            style: 'width: 100%;'
        }, 'tr');
        expect(result).toEqual({
            class: 'wikitable',
            style: 'width: 100%;'
        });

        result = Sanitizer.validateTagAttributes({
            'xmlns:lorem': 'ipsum',
            'xmlns:ipsum': 'javascript:',
            'xmlns:dolor': 'vbscript:',
        }, 'tr');
        expect(result).toEqual({
            'xmlns:lorem': 'ipsum',
        });

        result = Sanitizer.validateTagAttributes({
            'data-lorem': 'ipsum',
            'data-ooui': 'lorem ipsum',
            'data-mw': 'lorem ipsum',
            'data-parsoid': 'lorem ipsum',
        }, 'tr');
        expect(result).toEqual({
            'data-lorem': 'ipsum',
        });
    });

    afterEach(function() {
    });
});
