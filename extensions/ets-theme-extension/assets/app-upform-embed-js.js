document.addEventListener('DOMContentLoaded', () => {
    console.log('JavaScript loaded successfully!');
    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);

    let msgRating = $('.ets-rating-messsage');
    let allStar = $$('.ets-rating-star');

    $$('input[name="ets-rating-radio"]').forEach(function(star) {
        // star.addEventListener('change', function (e) {
        //     console.log(this.value);
        // });
        star.addEventListener('mouseover', function (e) {
            let currentValue = this.value;
            allStar.forEach(function(ele, idx) {
                if(idx <= currentValue) {
                    ele.style.color = 'gold';
                }else {
                    ele.style.color = 'black';
                }
            });
            
        })
    });

    msgRating.addEventListener( 'focus', function (e) {
        let parent = this.parentElement;
        parent.classList.remove('error');
        if($('.ets-rating-messsage-error')) {
            $('.ets-rating-messsage-error').remove();
        }
    });

    $('.ets-rating-form').style.display = 'block';

    function escapeHtml(html) {
        const entityMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        };
        return String(html).replace(/[&<>"'/]/g, (s) => entityMap[s]);
    }
    
    function validateMessage(message) {
        message = message.trim();

        if(message.length <= 0) {
            return {
                isValid: true,
                sanitizedMessage: ''
            };
        } 
        
        const minLength = 1;
        const maxLength = 500;
        if (message.length < minLength || message.length > maxLength) {
            return {
                isValid: false,
                error: `Thông điệp phải có độ dài từ ${minLength} đến ${maxLength} ký tự.`
            };
        }
    
        const sanitizedMessage = escapeHtml(message);
    
        return {
            isValid: true,
            sanitizedMessage: sanitizedMessage
        };
    }

    $('.ets-rating-submit').addEventListener( 'click', (e) => {
        
        let rate = 0;
        let validateMsg = validateMessage(msgRating.value);
        let message = '';

        if (validateMsg.isValid) {
            message = validateMsg.sanitizedMessage;
        }else {
            let msgWrap = $('.ets-rating-message-wrap');
            if($('.ets-rating-messsage-error')) {
                $('.ets-rating-messsage-error').innerText = validateMsg.error;
            }else {
                let errorMsg = document.createElement('span');
                errorMsg.classList.add('ets-rating-messsage-error');
                errorMsg.innerText = validateMsg.error;
                msgWrap.appendChild(errorMsg);
            }
            msgWrap.classList.add('error');
        }


        $$('input[name="ets-rating-radio"]').forEach(radio => {
            if (radio.checked) {
                rate = radio.value;
            }
        });
        console.log(rate, message);
        
    })
});