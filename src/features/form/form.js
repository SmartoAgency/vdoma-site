import * as yup from "yup";
import i18next from "i18next";
import axios from "axios";
import initView from "./form-view";
import { langDetect } from "@shared/scripts/helpers/helpers";

const sendForm = async (data) => {
  const response = await axios.post("/wp-admin/admin-ajax.php", data);
  return response.data;
};

/*  */
const lang = langDetect();
(async () => {
  await i18next.init({
    // lng: lang, // Текущий язык
    lng: "uk", // Текущий язык
    debug: false,
    resources: {
      ru: {
        // Тексты конкретного языка
        translation: {
          // Так называемый namespace по умолчанию
          name: "Имя:*",
          phone: "Телефон:*",
          send: "Отправить",
          sending: "Отправка",
          field_too_short: "Телефон должен содержать не менее {{cnt}} символов",
          field_too_long: "Телефон должен содержать не более {{cnt}} символов",
          only_number: "здесь только цифры",
          required: "это поле обязательне",
          sendingSuccessTitle: "Cообщение отправлено",
          sendingSuccessText: "Ждите ответа наших менеджеров",
          sendingErrorText: "Ждите ответа наших менеджеров",
          sendingErrorTitle: "Ошибка",
          send_fail: "Сообщение не было отправлено за неизвестной ошибки сервера. Код: [send_fail]",
          invalid_form: "Сообщение не было отправлено за неизвестной ошибки сервера. Код: [invalid_form]",
          front_error: "Сообщение не было отправлено за неизвестной ошибки сервера. Код: [front_error]",
          invalid_upload_file: "Ошибка загрузки файла. Код: [invalid_upload_file]",
          invalid_recaptcha: "Заполните капчу и попробуйте еще раз снова. Код: [invalid_recaptcha]",
          connectionFailed: "Ошибка соединения с CRM",
        },
      },
      tr: {
        translation: {
          name: "Adınız Soyadınız :*",
          title: "Fiyat teklifi al",
          phone: "Telefon:*",
          send: "Gönder",
          email: "E-Posta",
          agreement:
            "KVKK <a target='_blank' href='https://ramsturkiye.com.tr/{{lng}}/kvkk'>gizlilik şartlarını</a> okudum anladım.*",
          description: "E-posta Adresiniz",
          sending: "Gönderiyor",
          thank_title: "TEŞEKKÜR EDERİZ",
          thank_description: "Formunuz tarafımıza ulaşmıştır. En kısa sürede sizinle iletişime geçeceğiz.  ",
          thank_back_to_choose: "Daire Seçimine Geri Dön",
          thank_back_to_site: "Web Sitesine Geri Dön",
          field_too_short: "Telefon en az {{cnt}} karakter olmalı ",
          field_too_long: "Telefon en çok  {{cnt}} karakter olmalı",
          field_only_letter: "İsim sadece harf içermelidir ",
          field_more_letter: "İsim en çok 30 harf içerebilir",
          only_number: "Buraya sadece rakamlar",
          required: "bu alan gereklidir",
          sendingSuccessTitle: "Mesaj gönderildi",
          sendingSuccessText: "Yöneticilerimizden cevap bekleyiniz",
          sendingErrorText: "Yöneticilerimizden cevap bekleyiniz",
          sendingErrorTitle: "Bir hata oluştu",
          send_fail: "İleti, bilinmeyen bir sunucu hatası nedeniyle gönderilmedi. Kod: [send_fail] ",
          invalid_form: "The message was not sent for an unknown server error. Code: [invalid_form] ",
          front_error: "Sonucu hatasından dolayı mesaj gönderilemedi. Code: [front_error] ",
          invalid_upload_file: "Dosya yükleme hatası. Code: [invalid_upload_file] ",
          invalid_recaptcha: "Lütfen captcha'yı doldurun ve tekrar deneyin. Code: [invalid_recaptcha] ",
          connectionFailed: "Server sunucu bağlantı hatası",
        },
      },
      uk: {
        // Тексты конкретного языка
        translation: {
          // Так называемый namespace по умолчанию
          name: "Ім’я:*",
          phone: "Телефон:*",
          send: "Надіслати",
          sending: "Надіслати",
          field_too_short: "Телефон має містити принаймні {{cnt}} символів",
          field_too_long: "Телефон має містити не більше {{cnt}} символів",
          only_number: "Тут лише цифри",
          required: "Це поле є обов`язковим",
          sendingSuccessTitle: "Повідомлення надіслано",
          sendingSuccessText: "Чекайте відповіді наших менеджерів",
          sendingErrorText: "Чекайте відповіді наших менеджерів",

          sendingErrorTitle: "Сталася помилка",
          send_fail: "Повідомлення не було відправлено через невідому помилку сервера. Код: [send_fail] ",
          invalid_form:
            "Повідомлення не було відправлено через невідому помилку сервера. Код: [invalid_form] ",
          front_error: "Повідомлення не було відправлено через невідому помилку сервера. Код: [front_error] ",
          invalid_upload_file: "Помилка завантаження файлу. Код: [invalid_upload_file]",
          invalid_recaptcha: "Заповніть капчу і спробуйте ще раз знову. Код: [invalid_recaptcha]",
          connectionFailed: "Помилка з'єднання с CRM",
        },
      },
      en: {
        // Тексты конкретного языка
        translation: {
          // Так называемый namespace по умолчанию
          name: "Name:*",
          phone: "Phone:*",
          send: "Send",
          thank_title: "Thank you",
          thank_description:
            "Thank you for contacting us. Wait for a call from our managers. We wish you a pleasant day and good mood =)",
          thank_back_to_choose: "Back to choose the appartment",
          thank_back_to_site: "Back to the website",
          agreement:
            "KVKK <a target='_blank' href='https://ramsturkiye.com.tr/{{lng}}/kvkk'>privacy terms</a> I read, I understand.*",
          description: "E-mail",
          sending: "Sanding",
          email: "E-mail",
          field_too_short: "phone must be at least {{cnt}} characters",
          field_too_long: "phone must be at most {{cnt}} characters",
          field_only_letter: "name must contain only letters",
          field_more_letter: "name must be at most 30 letters",
          only_number: "only digits here",
          required: "this field is required",
          sendingSuccessTitle: "Message sent",
          sendingSuccessText: "Wait for the answers of our managers",
          sendingErrorText: "Wait for the answers of our managers",
          sendingErrorTitle: "An error has occurred",
          send_fail: "The message was not sent due to an unknown server error. Code: [send_fail] ",
          invalid_form: "The message was not sent for an unknown server error. Code: [invalid_form] ",
          front_error: "The message was not sent for an unknown server error. Code: [front_error] ",
          invalid_upload_file: "Error uploading file. Code: [invalid_upload_file] ",
          invalid_recaptcha: "Please fill in the captcha and try again. Code: [invalid_recaptcha] ",
          connectionFailed: "Server connection error",
        },
      },
    },
  });
})();
/*  */

export default class FormMonster {
  constructor(setting) {
    this.elements = setting.elements;
    this.$body = document.querySelector("body");
    this.showSuccessMessage = setting.showSuccessMessage || true;
    this.isFormSubmitted = false;
    this.state = {
      serverError: null,
      error: true,
      form: setting.elements.fields,
      status: "filling",
    };
    this.fieldsKey = Object.keys(this.elements.fields);
    this.watchedState = initView(this.state, this.elements);

    this.init();
  }

  validate(formData) {
    const formDataObj = this.fieldsKey.reduce((acc, key) => {
      acc[key] = formData.get(key);
      return acc;
    }, {});
    /*  */
    const shapeObject = this.fieldsKey.reduce((acc, key) => {
      acc[key] = this.elements.fields[key].rule;
      return acc;
    }, {});
    /*  */

    const schema = yup.object().shape(shapeObject);

    try {
      schema.validateSync(formDataObj, { abortEarly: false });
      return null;
    } catch (err) {
      return err.inner;
    }
  }

  changeInput() {
    return (e) => {
      /*  */
      e.preventDefault();
      this.watchedState.status = "filling";
      /*  */
      const formData = new FormData(this.elements.$form);
      /*  */
      const error = this.validate(formData);
      /*  */
      this.fieldsKey.map((key) => {
        const field = this.elements.fields[key];
        field.valid = true;
        field.error = [];
        return null;
      });
      /*  */
      /*  */
      if (error) {
        if (this.isFormSubmitted) {
          error.forEach(({ path, message }) => {
            this.watchedState.form[path].valid = false;
            this.watchedState.form[path].error.push(message);
            return null;
          });
          this.watchedState.error = true;
          this.watchedState.status = "renderErrorValidation";
        }
        return null;
      }
      this.watchedState.error = false;
      this.watchedState.status = "renderSuccessValidation";
      return null;
    };
  }

  submitForm() {
    return async (e) => {
      /*  */
      e.preventDefault();
      this.isFormSubmitted = true;
      this.changeInput()(e);

      /*  */
      if (this.watchedState.error === false) {
        try {
          this.watchedState.status = "loading";
          const formData = new FormData(this.elements.$form);
          formData.append("action", "app");

          /* eslint-disable-next-line */
          const { error, code_error } = await sendForm(formData);

          // if (true) {
          if (error === 0) {
            this.watchedState.status = "successSand";
            return true;
          }
          /* eslint-disable-next-line */
          this.watchedState.serverError = code_error;
          this.watchedState.status = "failed";
        } catch (err) {
          this.watchedState.error = err.message;
          this.watchedState.serverError = "front_error";
          this.watchedState.status = "failed";
        }
      }
      return null;
    };
  }

  listers() {
    this.elements.$form.addEventListener("submit", this.submitForm(this.watchedState));
    this.fieldsKey.map((key) => {
      const { input } = this.elements.fields[key].inputWrapper;

      if (!input) {
        return null;
      }

      const eventType = input.type === "checkbox" || input.tagName === "SELECT" ? "change" : "input";
      input.addEventListener("input", this.changeInput(this.watchedState));
      return null;
    });
  }

  init() {
    this.listers();
  }
}
