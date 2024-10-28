document.addEventListener("DOMContentLoaded", () => {
  console.log("JavaScript loaded successfully!");
  const $ = document.querySelector.bind(document);
  const $$ = document.querySelectorAll.bind(document);
  const APPURL = 'https://huydev.deskbox.org/etsapp1/api';

  const ETSValidate = {
    validate(rule, currentValue, comparativeValue) {
      let validateFunc = {
        min: (currentValue, comparativeValue) => parseFloat(currentValue) >= parseFloat(comparativeValue),
        max: (currentValue, comparativeValue) => {
          if (typeof currentValue === "string") {
            currentValue = parseFloat(currentValue.trim().length);
          } else {
            currentValue = parseFloat(currentValue);
          }

          comparativeValue = parseFloat(comparativeValue);

          return currentValue <= comparativeValue;
        },
        required: (currentValue) => currentValue.length > 0,
        email: (currentValue) => !currentValue || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentValue)
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
      return String(html)
        .replace(/[&<>"'/]/g, (s) => entityMap[s])
        .trim();
    },

    validateFields(data) {
      const errors = {};
      for (const field in data) {
        const fieldData = data[field];
        const rules = fieldData.validateRule.split("|");

        rules.forEach((rule) => {
          const [ruleName, ruleValue] = rule.split(":");

          if (
            ruleName &&
            !this.validate(ruleName, fieldData.value, ruleValue)
          ) {
            errors[fieldData.name] ||= [];
            errors[fieldData.name].push(fieldData.validateMessage[ruleName]);
          }
        });
      }

      return Object.keys(errors).length ? errors : null;
    },
  };

  const ETSRatingApp = {
    async init() {
      this.currentReviewId = null;
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
          if (this.formReview.classList.contains("new") || this.formReview.classList.contains("editing")) {
            $(".ets-rating-stars").classList.remove("error");
            let startMsgError = $(".ets-rating-stars-messsage-error");
            if (startMsgError) {
              startMsgError.remove();
            }

            let currentValue = eleSelected.previousElementSibling.value;

            $$(".ets-rating-star").forEach(function (ele, idx) {
              ele.style.color = idx < currentValue ? "gold" : "black";
            });
          }
          break;
        case 'ets-rating-action-edit':
          this.toggleEditState(false);
          break;
        case 'ets-rating-action-delete':
          this.deleteRating(this.currentReviewId);
          break;
        case 'ets-rating-action-close':
          this.toggleEditState(true);
          break;
      }
    },

    async loadData() {
      let productID = $('input[name="ets_product_id"]').value,
        customerID = $('input[name="ets_customer_id"]').value;

      try {
        const response = await fetch(
          `${APPURL}/getDataRating?productID=${productID}&customerID=${customerID}`
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
                        <span class="ets-reviews-name">${review.customerName
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
        this.currentReviewId = reviewOfCustomer[0]._id;
        if (reviewOfCustomer[0].ratingStatus === "approved") return;
      }

      let currentState = reviewOfCustomer.length > 0 ? "pending" : "new";
      this.currentState = currentState;
      let ratingRightBox = `
        <div class="ets-rating-right-box">
          <div class="ets-rating-status">Pending</div>
          <div class="ets-rating-action-wrap">
            <span class="ets-rating-action-three-dots">&#8230;</span>
            <ul class="ets-rating-action">
              <li class="ets-rating-action-edit">Edit</li>
              <li class="ets-rating-action-delete">Delete</li>
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

          if (keyField === "ets_rating_radio") {
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
                                value="${choice}" ${element.value && element.value === choice ? 'checked' : ''}>
                                <span class="ets-rating-star" ${element.value && element.value >= choice
                    ? 'style="color:gold;"'
                    : ""
                  } >★</span>
                            </label>
                        `;
              })
              .join("");

            ratingStars.insertAdjacentHTML("beforeend", "Rating");
            ratingStars.insertAdjacentHTML("beforeend", stars);

            this.formReview.appendChild(ratingStars);
          }

          if (keyField === "ets_rating_message") {
            this.formReview.insertAdjacentHTML(
              "beforeend",
              `
                        <div class="ets-rating-message-wrap">
                            <textarea class="ets-rating-messsage" ${element.placeHolder
                ? 'placeholder="' + element.placeHolder + '"'
                : ""
              } rows="${element.rows}" cols="${element.cols
              }" name="${element.name}" ${element.value ? "disabled" : ""}>${element.value || ""
              }</textarea>
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

    toggleEditState(isPending) {
      this.formReview.classList.toggle("pending", isPending);
      this.formReview.classList.toggle("editing", !isPending);
      $(".ets-rating-messsage").disabled = isPending;
    },

    async deleteRating(reviewId) {
      if (confirm('Do you want to delete this review?')) {
        try {
          const response = await fetch(
            `${APPURL}/deleteRating?reviewId=${reviewId}`);

          let data = await response.json();
          if (data.status === "success") {
            console.log(data.message);
            location.reload();
          } else {
            console.log(data.message);
          }
        } catch (error) {
          console.log(error);
        }
      }

    },

    async saveRating(formData) {
      let orderID = $('[name="ets_order_id"]').value;
      if (orderID) formData.ets_order_id = orderID;
      if (this.currentReviewId) formData.ets_review_id = this.currentReviewId;
      
      
      formData.ets_rating_message = ETSValidate.escapeHtml(
        formData.ets_rating_message
      );


      try {
        const response = await fetch(
          `${APPURL}/saveRating`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify(formData),
          }
        );

        let data = await response.json();
        if (data.status === "success") {
          console.log(data.message);
          location.reload();
        } else {
          this.renderError(data.error);
        }
      } catch (error) {
        console.log(error);
      }
    },

    submitRating() {
      const extractValues = (data) => {
        let result = {};

        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            result[key] = data[key].value;
          }
        }

        return result;
      };

      this.clearError();
      this.assignValueToFormField();

      let errors = ETSValidate.validateFields(this.formField);     
      
      if (errors && Object.keys(errors).length > 0) {
        this.renderError(errors);
      } else {
        this.saveRating(extractValues(this.formField));

      }
    },

    clearError() {
      let element = $(".error");
      if (element) {
        element.classList.remove("error");
        let errorMsg = element.querySelector(".ets-rating-messsage-error");
        if (errorMsg) {
          errorMsg.remove();
        }
      }
    },

    assignValueToFormField() {
      for (const keyField in this.formField) {
        if (Object.prototype.hasOwnProperty.call(this.formField, keyField)) {
          const element = this.formField[keyField];
          if (element.type === "radio") {
            element.value = $(`[name="${element.name}"]:checked`)
              ? $(`[name="${element.name}"]:checked`).value
              : 0;
          } else {
            element.value = $(`[name="${element.name}"]`).value;
          }
        }
      }
    },

    renderError(errors) {
      if (Object.keys(errors).length > 0) {
        for (const keyError in errors) {
          if (Object.prototype.hasOwnProperty.call(errors, keyError)) {
            const objError = errors[keyError];
            let container = null,
              msgError = null;
            if (keyError === "ets_rating_radio") {
              container = $(".ets-rating-stars");

            }
            if (keyError === "ets_rating_message") {
              container = $(".ets-rating-message-wrap");
            }

            msgError = container.querySelector(".ets-rating-messsage-error");
            if (msgError) {
              msgError.innerText = objError[0];
            } else {
              let errorMsg = document.createElement("p");
              errorMsg.classList.add("ets-rating-messsage-error");
              errorMsg.innerText = objError[0];
              container.appendChild(errorMsg);
            }
            container.classList.add("error");
          }
        }
      }
      return;
    },
  };

  ETSRatingApp.init();
});
