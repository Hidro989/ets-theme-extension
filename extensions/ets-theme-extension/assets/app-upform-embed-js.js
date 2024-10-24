document.addEventListener("DOMContentLoaded", () => {
  console.log("JavaScript loaded successfully!");
  const $ = document.querySelector.bind(document);
  const $$ = document.querySelectorAll.bind(document);

  const ETSValidate = {
    validate(rule, currentValue, comparativeValue) {
      let validateFunc = {
        min: (currentValue, comparativeValue) => {
          currentValue = parseFloat(currentValue);
          comparativeValue = parseFloat(comparativeValue);

          return currentValue >= comparativeValue;
        },
        max: (currentValue, comparativeValue) => {
          if (currentValue instanceof String) {
            currentValue = parseFloat(currentValue.length);
          } else {
            currentValue = parseFloat(currentValue.length);
          }

          comparativeValue = parseFloat(comparativeValue);

          return currentValue <= comparativeValue;
        },
      };

      return validateFunc[rule](currentValue, comparativeValue);
    },

    escapeHtml(html) {
      const entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;",
      };
      return String(html).replace(/[&<>"'/]/g, (s) => entityMap[s]);
    },

    validateFields(data) {
      const errors = {};

      for (const field in data) {
        const fieldData = data[field];
        const rules = fieldData.validateRule.split("|");

        rules.forEach((rule) => {
          const [ruleName, ruleValue] = rule.split(":");

          if (!this.validate(ruleName, fieldData.value, ruleValue)) {
            if (!errors[fieldData.name]) {
              errors[fieldData.name] = [];
            }
            errors[fieldData.name].push(fieldData.validateMessage[ruleName]);
          }
        });
      }

      return errors ? errors : null;
    },
  };

  const ETSRatingApp = {
    async init() {
      this.formReview = $(".ets-rating-form");
      this.currentState = "new";
      this.formField = null;
      this.formReview.style.display = "block";

      await this.loadData();

      this.formReview.addEventListener("click", this.click.bind(this));
    },

    click(e) {
      let eleSelected = e.target;

      switch (eleSelected.classList[0]) {
        case "ets-rating-submit":
          this.submitRating();
          break;
        case "ets-rating-star":
          $(".ets-rating-stars").classList.remove("error");
          let startMsgError = $(".ets-rating-stars-messsage-error");
          if (startMsgError) {
            startMsgError.remove();
          }

          let currentValue = eleSelected.previousElementSibling.value;

          $$(".ets-rating-star").forEach(function (ele, idx) {
            if (idx < currentValue) {
              ele.style.color = "gold";
            } else {
              ele.style.color = "black";
            }
          });
          break;
      }
    },


    async loadData() {
      let productID = $('input[name="ets-product-id"]').value,
        customerID = $('input[name="ets-customer-id"]').value;

      try {
        const response = await fetch(
          `https://huydev.deskbox.org/etsapp1/api/getDataRating?productID=${productID}&customerID=${customerID}`
        );

        let data = await response.json();
        if (data.status === "success") {
          const { reviews, reviewOfCustomer, formField } = data.data;
          this.renderReviews(reviews);
          this.renderFormField(reviewOfCustomer, formField);
          this.formField = formField;
        } else {
          console.log(data);
        }
      } catch (error) {
        console.log(error);
      }
    },

    renderReviews(reviews) {
      let reviewsContainer = $(".ets-reviews");

      function renderStars(rating) {
        let stars = "";
        for (let i = 0; i < rating; i++) {
          stars += "★";
        }
        return stars;
      }

      if (reviews.length > 0) {
        let html = reviews.map((review) => {
          return `
                    <div class="ets-reviews-item">
                        <span class="ets-reviews-name">${
                          review.customerName
                        }</span>
                        <span class="ets-reviews-star">${renderStars(
                          review.rating
                        )}</span>
                        <p>
                        ${review.message}
                        </p>
                    </div>`;
        });
        reviewsContainer.innerHTML = html.join("");
      } else {
        reviewsContainer.remove();
      }
    },

    renderFormField(reviewOfCustomer, formField) {
      if (reviewOfCustomer[0]) {
        if (reviewOfCustomer[0].ratingStatus === "approved") {
          return;
        }
      }

      let currentState = reviewOfCustomer.length > 0 ? "pending" : "new";
      this.currentState = currentState;
      let ratingRightBox = `
        <div class="ets-rating-right-box">
          <div class="ets-rating-status">Pending</div>
          <div class="ets-rating-action-wrap">
            <span class="ets-rating-action-three-dots">&#8230;</span>
            <ul class="ets-rating-action">
              <li>Edit</li>
              <li>Delete</li>
            </ul>
          </div>
          <span class="ets-rating-action-close">&#x2715;</span>
        </div>`;

      if (currentState === "pending") {
        this.formReview.insertAdjacentHTML("beforeend", ratingRightBox);
      }

      for (const keyField in formField) {
        if (Object.prototype.hasOwnProperty.call(formField, keyField)) {
          const element = formField[keyField];

          if (keyField === "rating") {
            let ratingStars = document.createElement("span");
            ratingStars.classList.add("ets-rating-stars");

            let stars = element.choices
              .map((choice) => {
                return `
                            <label for="ets-rating-radio-${choice}">
                                <input
                                type="radio"
                                id="ets-rating-radio-${choice}"
                                name="${element.name}"
                                hidden
                                value="${choice}">
                                <span class="ets-rating-star">★</span>
                            </label>
                        `;
              })
              .join("");

            ratingStars.insertAdjacentHTML("beforeend", "Rating");
            ratingStars.insertAdjacentHTML("beforeend", stars);

            this.formReview.appendChild(ratingStars);
          }

          if (keyField === "msg") {
            this.formReview.insertAdjacentHTML(
              "beforeend",
              `
                        <div class="ets-rating-message-wrap">
                            <textarea class="ets-rating-messsage" ${
                              element.placeHolder
                                ? 'placeholder="' + element.placeHolder + '"'
                                : ""
                            } rows="${element.rows}" cols="${
                element.cols
              }" name="${element.name}"></textarea>
                        </div>
                    `
            );
          }
        }
      }

      this.formReview.insertAdjacentHTML(
        "beforeend",
        `<div class="ets-rating-submit">Submit</div>`
      );
      this.formReview.classList.add(currentState);
    },

    async saveRating(formData) {
      // const {productID, rating, msg, productTitle,customerID, customerName, customerEmail} = data;
      console.log(formData);
      try {
        const response = await fetch(
          "https://huydev.deskbox.org/etsapp1/api/saveRating",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        let data = await response.json();
        if (data.status === "success") {
          console.log(data.message);
        } else {
          console.log(data);
        }
      } catch (error) {
        console.log(error);
      }
    },

    submitRating() {
        this.clearError();

        let rating = 0,
        msg = "",
        productID = $('input[name="ets-product-id"]').value,
        productTitle = $('input[name="ets-product-title"]').value,
        customerID = $('input[name="ets-customer-id"]').value,
        customerName = $('input[name="ets-customer-name"]').value,
        customerEmail = $('input[name="ets-customer-email"]').value;

      for (const keyField in this.formField) {
        if (Object.prototype.hasOwnProperty.call(this.formField, keyField)) {
          const element = this.formField[keyField];
          if (element.type === "radio") {
            element.value = $(`[name="${element.name}"]:checked`)?.value ?? 0;
            rating = element.value;
          } else {
            element.value = $(`[name="${element.name}"]`).value;
            msg = element.value;
          }
        }
      }

      let errors = ETSValidate.validateFields(this.formField);
      
      if(Object.keys(errors).length > 0) {
        for (const keyError in errors) {
            if (Object.prototype.hasOwnProperty.call(errors, keyError)) {
              const objError = errors[keyError];
    
              if (keyError === "ets-rating-radio") {
                let ratingStars = $(".ets-rating-stars"),
                  startMsgError = ratingStars.querySelector(".ets-rating-messsage-error");
                if (startMsgError) {
                  startMsgError.innerText = objError[0];
                } else {
                  let errorMsg = document.createElement("p");
                  errorMsg.classList.add("ets-rating-messsage-error");
                  errorMsg.innerText = objError[0];
                  ratingStars.appendChild(errorMsg);
                }
                ratingStars.classList.add("error");
              }
              if (keyError === "ets-rating-messsage") {
                let msgWrap = $(".ets-rating-message-wrap"),
                  msgRatingError = msgWrap.querySelector(".ets-rating-messsage-error");
                if (msgRatingError) {
                  msgRatingError.innerText = objError[0];
                } else {
                  let errorMsg = document.createElement("span");
                  errorMsg.classList.add("ets-rating-messsage-error");
                  errorMsg.innerText = objError[0];
                  msgWrap.appendChild(errorMsg);
                }
                msgWrap.classList.add("error");
              }
            }
          }
        return;
      }

      this.saveRating({
        productID,
        rating,
        msg,
        productTitle,
        customerID,
        customerName,
        customerEmail,
      });
    },

    clearError() {
        let element = $( '.error' );
        if (element) {
            element.classList.remove('error');
            let errorMsg = element.querySelector('.ets-rating-messsage-error');
            if(errorMsg) {
                errorMsg.remove();
            }
        }
    }
  };

  ETSRatingApp.init();
});
