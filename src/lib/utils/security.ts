import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string): string => {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'ul', 'ol', 'li',
            'strong', 'em', 'u', 's',
            'code', 'pre', 'blockquote',
            'span', 'div'
        ],
        ALLOWED_ATTR: ['class', 'style']
    });
};
