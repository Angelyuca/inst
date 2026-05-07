const translationsMap = {
    bonus: '',
    title: 'Spin the wheel and win prizes!',
    modalHead: 'Congratulations!',
    modalStageInfo: 'Spin the wheel again to get more gifts',
    modalFinalInfo: 'Please, register to receive gift',
    modalStageBtn: 'Get more gifts',
    modalFinalBtn: 'Sign Up',
    sector1: '25FS',
    sector2: 'Bonus 120%',
    sector3: '60 EUR',
    sector4: 'Bonus 100%',
    sector5: '100FS',
    sector6: 'Bonus 110%',
    sector7: 'Bonus 130%',
    sector8: 'Bonus 140%',
}

export function useI18n() {
    const translation = translationsMap

    const applyTranslation = (parent = 'body') => {
        const elementsWithTranslation = $(`${parent} *[data-translation-key]`)

        elementsWithTranslation.each((i, element) => {
            if (element.tagName.toLowerCase() === 'input') {
                $(element).attr('value', translation[$(element).data('translation-key') || ''])
            } else {
                $(element).text(translation[$(element).data('translation-key') || ''])
            }
        })
    }

    return {
        translation,
        applyTranslation
    }
}
