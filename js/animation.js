import {useI18n} from './i18n.js'

export function useWheelAnimation(translation, currentCurrency) {
    const {applyTranslation} = useI18n()

    const maxSpinValue = 2;
    const wheelValues = [
        {
            type: 'currency',
            value: translation.sector1
        },
        {
            type: 'bonus',
            value: translation.sector2
        },
        {
            type: 'currency',
            value: translation.sector3
        },
        {
            type: 'bonus',
            value: translation.sector4
        },
        {
            type: 'currency',
            value: translation.sector5
        },
        {
            type: 'currency',
            value: translation.sector6
        },
        {
            type: 'currency',
            value: translation.sector7
        },
        {
            type: 'currency',
            value: translation.sector8
        },
    ]

    const getWheelText = (item) => {
        if (item.type === 'currency') {
            return [item.value, currentCurrency]
        }

        if (item.type === 'bonus') {
            return [item.value, translation.bonus]
        }
    }
    const appendWheelTextBlock = () => {
        const wrap = $('.wheel__text-block');

        const wheelElements = wheelValues.map((item, i) => {
            const wheelText = getWheelText(item)

            return $(
                `<div class="wheel__text-wrap" style="--i: ${i + 1}">
               <div class="wheel__text">
                  ${wheelText[0]}
                  <br/>
                  ${wheelText[1]} 
                </div>
            </div>`
            )
        })

        wrap.append(wheelElements)
    }
    const setupAnimation = () => {
        appendWheelTextBlock()

        function get_random_int(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        const $play = $('#play');
        const wheel = $('.wheel__element');
        const text = $('.wheel__text-block');
        const textWrap = $('.wheel__text-wrap');
        const current = $('.wheel__active');

        let indicator;
        let luckywheel;

        const handleModalBtnClick = () => {
            const modal = $('.modal');
            const result = JSON.parse(localStorage.getItem('basswin_bbbonanza'));

            if (result.level >= maxSpinValue) {
                const link = "https://afftrafi.co/ktVmDV?";
                const sPageURL = window.location.search.substring(1);
                const mainLink = link + "&" + sPageURL;
                window.location.href = mainLink;
            } else {
                modal.fadeOut();
                $play.trigger('click');
            }
        }
        const showModal = () => {
            const result = JSON.parse(localStorage.getItem('basswin_bbbonanza'));
            const modal = result.level >= maxSpinValue ? $('#final-modal') : $('#stage-modal');
            const textResult = result ? result.value.reduce((acc, item) => {
                const text = getWheelText(item)
                if (!acc) {
                    acc = `${text[0]} ${text[1]}`
                    return acc
                }

                acc += `+ ${text[0]} ${text[1]}`
                return acc
            }, '') : ''

            if (result.level >= maxSpinValue) {
                $('.modal__info').data('translation-key', 'modalFinalInfo');
                $('.modal__btn').data('translation-key', 'modalFinalBtn');
                applyTranslation('.modal');
                $('.modal__btn').off('click', handleModalBtnClick);
            } else {
                $('.modal__btn').on('click', handleModalBtnClick);
            }

            $('.modal__result').html(textResult);
            modal.fadeIn();
        }

        function spinner() {
            indicator.to(current, .13, {
                rotation: -10,
                transformOrigin: '65% 36%',
                ease: Power1.easeOut
            }).to(current, .13, {
                rotation: 3,
                ease: Power4.easeOut
            }).add('end');

            const rotation = [2070, 4185]
            const prevGameResult = JSON.parse(localStorage.getItem('basswin_bbbonanza'))
            luckywheel.to([wheel, text], 5, {
                rotation: rotation[prevGameResult ? prevGameResult.level : 0] + '_cw',
                ease: Power4.easeOut,
                onComplete: function () {
                    $play.attr('disabled', false);
                    const position = Math.round((rotation[prevGameResult ? prevGameResult.level : 0] / 360 - Math.floor(rotation[prevGameResult ? prevGameResult.level : 0] / 360)) * 8);
                    const wheelActiveElement = Array.from(textWrap).at(position > 7 ? 1 : 1 - position)
                    wheelActiveElement.classList.add('active');
                    const currentGameResult = wheelValues.at(position > 7 ? 1 : 1 - position)
                    const result = {
                        level: prevGameResult ? prevGameResult.level + 1 : 1,
                        value: prevGameResult
                            ? [
                                ...prevGameResult.value,
                                currentGameResult
                            ]
                            : [currentGameResult]
                    }
                    localStorage.setItem('basswin_bbbonanza', JSON.stringify(result))

                    setTimeout(() => {
                        showModal()
                    }, 600)
                },
            });
        }

        $play.click(function () {
            const gameResult = JSON.parse(localStorage.getItem('basswin_bbbonanza'))
            if (gameResult && gameResult.level >= maxSpinValue) return
            $play.attr('disabled', true);
            textWrap.removeClass('active');
            indicator = new TimelineMax();
            luckywheel = new TimelineMax();
            spinner();
            indicator.timeScale(1).seek(0);
            luckywheel.timeScale(1).seek(0);
        });

        if (JSON.parse(localStorage.getItem('basswin_bbbonanza'))) {
            showModal();
        }
    }

    return {
        setupAnimation
    }
}
