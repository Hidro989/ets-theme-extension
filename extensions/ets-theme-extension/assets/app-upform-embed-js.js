document.addEventListener('DOMContentLoaded', () => {
    console.log('JavaScript loaded successfully!');
    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);
    
    if (typeof Shopify !== 'undefined') {
        if (Shopify.product) {
            const product = Shopify.product;
            console.log('Thông tin sản phẩm:', product);
            
          }
    }

    let msgRating = $('.ets-rating-messsage');
    let allStar = $$('.ets-rating-star');

    allStar.forEach( function(star) {
        star.addEventListener('click', function( e ) {
            $('.ets-rating-stars').classList.remove('error');
            $('.ets-rating-stars-messsage-error').remove();
            let currentValue = this.previousElementSibling.value;
            allStar.forEach(function(ele, idx) {
                if(idx < currentValue) {
                    ele.style.color = 'gold';
                }else {
                    ele.style.color = 'black';
                }
            });
        });
    });


    if (msgRating) {
        msgRating.addEventListener( 'focus', function (e) {
            let parent = this.parentElement;
            parent.classList.remove('error');
            if($('.ets-rating-messsage-error')) {
                $('.ets-rating-messsage-error').remove();
            }
        });
    }

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

    async function saveRating(formData) {
        // const {productID, rating, msg, productTitle,customerID, customerName, customerEmail} = data;
        console.log(formData);
        
        const response = await fetch('https://huydev.deskbox.org/etsapp1/api/saveRating', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
              },
            body: JSON.stringify(formData),
        });

        let data = await response.json();
        console.log(data.message);
        
    }

    $('.ets-rating-submit').addEventListener( 'click', (e) => {
        
        let rating = 0,
        validateMsg = validateMessage(msgRating.value),
        msg = '',
        productID = $('input[name="ets-product-id"]').value,
        productTitle = $('input[name="ets-product-title"]').value,
        customerID = $('input[name="ets-customer-id"]').value,
        customerName = $('input[name="ets-customer-name"]').value,
        customerEmail = $('input[name="ets-customer-email"]').value;
    

        if (validateMsg.isValid) {
            msg = validateMsg.sanitizedMessage;
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

            return;
        }


        $$('input[name="ets-rating-radio"]').forEach(radio => {
            if (radio.checked) {
                rating = radio.value;
            }
        });

        if( rating <= 0 ) {
            let ratingStars = $('.ets-rating-stars');
            if($('.ets-rating-stars-messsage-error')) {
                $('.ets-rating-stars-messsage-error').innerText = 'Vui lòng thêm đánh giá của bạn';
            }else {
                let errorMsg = document.createElement('p');
                errorMsg.classList.add('ets-rating-stars-messsage-error');
                errorMsg.innerText ='Vui lòng thêm đánh giá của bạn';
                ratingStars.appendChild(errorMsg);
            }
            ratingStars.classList.add('error');

            return;
        }

        saveRating({productID, rating, msg, productTitle,customerID, customerName, customerEmail});
        
    })
});