class MWParser {

    handleTables(text) {
        let out = '';
        const td_history = []; // Is currently a td tag open?
        const last_tag_history = []; // Save history of last lag activated (td, th or caption)
        const tr_history = []; // Is currently a tr tag open?
        const tr_attributes = []; // history of tr attributes
        const has_opened_tr = []; // Did this table open a <tr> element?
        let indent_level = 0; // poziom zagnieżdzenia tabeli


        text.split(/\r?\n/).forEach(line => {
            line = line.trim();

            // pusta linia uwzględniana w wyniku
            if(line == '') {
                out += line + '\n';
                return;
            }

            const first_character = line[0];
            const first_two = line.substr(0, 2);
            let matches = /^(:*)\s*\{\|(.*)$/.exec(line);

            if(matches) {
                // matches = ['{|class="wikitable" style="width: 100%;"', '', 'class="wikitable" style="width: 100%;"']

                // sprawdzamy, czy to początek nowej tabeli
                indent_level = matches[1].length; // wcięcia (: dla kolejnych poziomów)

                // FIXME $attributes = $this->mStripState->unstripBoth( $matches[2] );
                // FIXME $attributes = Sanitizer::fixTagAttributes( $attributes, 'table' );
                let attributes = matches[2];

                line = '<dl><dd>'.repeat(indent_level) + `<table ${ attributes }>`;

                td_history.push(false);
                last_tag_history.push('');
                tr_history.push(false);
                tr_attributes.push('')
                has_opened_tr.push(false);
            }
            else if(td_history.length == 0) { // brak otwartego td - nic nie robimy
                out += line + '\n';
                return;
            }
            else if(first_two == '|}') { // koniec tabeli
                line = '</table>' + line.substr(2);
                const last_tag = last_tag_history.pop();

                if(!has_opened_tr.pop())
                    line = `<tr><td></td></tr>${ line }`;

                if(tr_history.pop())
                    line = `</tr>${ line }`;

                if(td_history.pop())
                    line = `</${ last_tag }>${ line }`;

                tr_attributes.pop();

                if(indent_level > 0)
                    line = line.rtrim() + '</dd></dl>'.repeat(indent_level)
            }
            else if (first_two === '|-') { // linia (tr) tabelki
                line = line.replace(/^\|-/, '');
                //preg_replace( '#^\|-+#', '', $line );

                //Whats after the tag is now only attributes
                // FIXME $attributes = $this->mStripState->unstripBoth( $line );
                // FIXME $attributes = Sanitizer::fixTagAttributes( $attributes, 'tr' );
                let attributes = line;
                tr_attributes.pop();
                tr_attributes.push(attributes);

                line = '';
                const last_tag = last_tag_history.pop();
                has_opened_tr.pop();
                has_opened_tr.push(true);

                if(tr_history.pop())
                    line = '</tr>';

                if(td_history.pop())
                    line = `</${ last_tag }>${ line }`;

                tr_history.push(false);
                td_history.push(false);
                last_tag_history.push('');
            }
            else if(first_character == '|' || first_character == '!' || first_two == '|+') { // td, th lub caption
                if(first_two == '|+' ) {
                    first_character = '+';
                    line = line.substr(2);
                }
                else
                    line = line.substr(1);

                // Implies both are valid for table headings.
                if(first_character == '!') {
                    //FIXME line = StringUtils::replaceMarkup( '!!', '||', $line );
                }

                line.split('||').forEach(cell => {
                    let previous = '';
                    if(first_character != '+') {
                        let tr_after = tr_attributes.pop();
                        if(!tr_history.pop())
                            previous = `<tr${ tr_after }>\n`;

                        tr_history.push(true);
                        tr_attributes.push('');
                        has_opened_tr.pop();
                        has_opened_tr.push(true);
                    }

                    let last_tag = last_tag_history.pop();

                    if(td_history.pop())
                        previous = `</${ last_tag }>\n${ previous }`;

                    if(first_character == '|')
                        last_tag = 'td';
                    else if(first_character == '!')
                        last_tag = 'th';
                    else if(first_character == '+')
                        last_tag = 'caption';
                    else
                        last_tag = '';

                    last_tag_history.push(last_tag);

                    // A cell could contain both parameters and data
                    let cell_data = cell.split(); // FIXME

                    // T2553: Note that a '|' inside an invalid link should not
                    // be mistaken as delimiting cell parameters
                    // Bug T153140: Neither should language converter markup.
                    if(/\[\[|-\{/.test(cell_data[0])) // ?
                        cell = `${ previous }<${ last_tag }>${ cell.trim() }`;
                    else if(cell_data.length == 1) // Whitespace in cells is trimmed
                        cell = `${ previous }<${ last_tag }>${ cell_data[0].trim() }`;
                    else {
                        // $attributes = $this->mStripState->unstripBoth( $cell_data[0] );
                        // $attributes = Sanitizer::fixTagAttributes( $attributes, $last_tag );
                        let attributes = cell_data[0];
                        // Whitespace in cells is trimmed
                        cell = `${ previous }<${ last_tag } ${ attributes }>${ cell_data[1].trim() }`;
                    }

                    line = cell;
                    td_history.push(true);
                });
            }

            out += line + '\n';
        });


        //Closing open td, tr && table
        while(td_history.length > 0 ) {
            if(td_history.pop())
                out += '</td>\n';

            if(tr_history.pop())
                out += '</tr>\n';

            if(has_opened_tr.pop())
                out += '<tr><td></td></tr>\n';

            out += '</table>\n';
        }

        //Remove trailing line-ending (b/c)
        if(out.substr(-1) == '\n')
            out = out.substr(0, out.length -1);

        //special case: don't return empty table
        if(out == '<table>\n<tr><td></td></tr>\n</table>')
            out = '';

        return out;
    }

};
